import { Controller, Get, Post, Param, Body, Res, Query, HttpStatus } from '@nestjs/common';
import { User } from './entities/user.entity.js';
import { Partner } from './entities/partner.entity.js';
import { Vehicle } from './entities/vehicle.entity.js';
import { Notification } from './entities/notification.entity.js';
import { DeviceToken } from './entities/device-token.entity.js';
import { MoreThanOrEqual } from 'typeorm';

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

@Controller('api/admin')
export class UserController {

  // ── Chart statistics endpoint ─────────────────────────────────────────────
  @Get('stats')
  async getStats(
    @Query('period') period: string = 'weekly',
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Res() res?: any,
  ) {
    try {
      const now = new Date();
      let startDate = new Date();
      let bucketFormat: 'day' | 'month' = 'day';

      if (period === 'custom' && from && to) {
        startDate = new Date(from);
        const diffDays = (new Date(to).getTime() - startDate.getTime()) / 86400000;
        bucketFormat = diffDays > 60 ? 'month' : 'day';
      } else if (period === 'weekly') {
        startDate.setDate(now.getDate() - 6);
      } else if (period === 'monthly') {
        startDate.setDate(now.getDate() - 30);
      } else if (period === 'yearly') {
        startDate.setFullYear(now.getFullYear() - 1);
        bucketFormat = 'month';
      } else if (period === 'all') {
        startDate = new Date('2024-01-01');
        bucketFormat = 'month';
      }
      startDate.setHours(0, 0, 0, 0);
      const endDate = period === 'custom' && to ? new Date(to) : now;

      // Build empty buckets for every date in range
      const buildBuckets = (start: Date, end: Date, fmt: 'day' | 'month') => {
        const buckets: Record<string, { users: number; partners: number }> = {};
        const cursor = new Date(start);
        while (cursor <= end) {
          const key = fmt === 'month'
            ? `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
            : cursor.toISOString().split('T')[0];
          buckets[key] = { users: 0, partners: 0 };
          if (fmt === 'month') cursor.setMonth(cursor.getMonth() + 1);
          else cursor.setDate(cursor.getDate() + 1);
        }
        return buckets;
      };

      const buckets = buildBuckets(startDate, endDate, bucketFormat);

      const dateFn = bucketFormat === 'month' ? `TO_CHAR(created_at, 'YYYY-MM')` : `TO_CHAR(created_at, 'YYYY-MM-DD')`;

      const userRows: any[] = await User.getRepository().query(
        `SELECT ${dateFn} AS day, COUNT(*) AS count FROM users WHERE created_at >= $1 AND created_at <= $2 GROUP BY day ORDER BY day ASC`,
        [startDate, endDate]
      );
      const partnerRows: any[] = await Partner.getRepository().query(
        `SELECT ${dateFn} AS day, COUNT(*) AS count FROM partners WHERE created_at >= $1 AND created_at <= $2 GROUP BY day ORDER BY day ASC`,
        [startDate, endDate]
      );

      userRows.forEach(r => { if (buckets[r.day]) buckets[r.day].users = parseInt(r.count); });
      partnerRows.forEach(r => { if (buckets[r.day]) buckets[r.day].partners = parseInt(r.count); });

      const chartData = Object.entries(buckets).map(([label, v]) => ({ label, users: v.users, partners: v.partners }));

      const usersTotal = await User.count({ where: { createdAt: MoreThanOrEqual(startDate) } });
      const partnersTotal = await Partner.count({ where: { createdAt: MoreThanOrEqual(startDate) } });

      return res.status(HttpStatus.OK).json({
        users: usersTotal,
        partners: partnersTotal,
        payments: 1450,
        chartData,
        period,
      });
    } catch (error) {
      console.error('Stats error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  @Get('users/:id/details')

  async getUserDetails(@Param('id') id: string, @Res() res: any) {
    try {
      const user = await User.findOne({
        where: { id },
      });

      if (!user) return res.status(HttpStatus.NOT_FOUND).json({ message: 'User not found' });

      // We explicitly load internal native relationships structurally locally!
      const vehicles = await Vehicle.find({
        where: { user: { id } },
        relations: ['aiAnalyses', 'serviceRecords'],
        order: { createdAt: 'DESC' }
      });

      return res.status(HttpStatus.OK).json({ user, vehicles });
    } catch (error) {
      console.error('Error fetching user details:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
    }
  }

  @Post('users/:id/notify')
  async notifyUser(@Param('id') id: string, @Body() body: any, @Res() res: any) {
    try {
      const user = await User.findOne({ where: { id } });
      if (!user) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: 'User not found' });
      }

      // Create raw postgres push mapping safely mirroring backend schemas!
      const notification = new Notification();
      notification.userId = id;
      notification.type = body.type || 'system';
      notification.title = body.title || 'Notification';
      notification.body = body.message || '';
      notification.isRead = false;
      notification.pushSent = false;
      await notification.save();

      // Dispatch Firebase FCM organically exactly mapping frontend payloads!
      try {
        if (!getApps().length) {
          const fs = await import('fs');
          const path = await import('path');
          const serviceAccountString = fs.readFileSync(path.resolve(process.cwd(), './firebase.json'), 'utf8');
          const serviceAccount = JSON.parse(serviceAccountString);
          initializeApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.project_id
          });
        }
        
        console.log(`[Push Notification] Starting Firebase dispatch...`);
        const tokens = await DeviceToken.find({ where: { userId: id } });
        console.log(`[Push Notification] Found ${tokens.length} device tokens for user ${id}`);
        
        if (tokens.length > 0) {
          const message = {
            notification: {
              title: notification.title,
              body: notification.body,
            },
            data: {
              type: notification.type,
              id: notification.id,
            },
            tokens: tokens.map((t) => t.token),
          };
          console.log(`[Push Notification] Extracted exactly tokens:`, message.tokens);
          
          await getMessaging().sendEachForMulticast(message);
          console.log(`[Push Notification] Firebase multicast successful!`);
          
          notification.pushSent = true;
          await notification.save();
        } else {
          console.log(`[Push Notification] Canceled! No tokens available perfectly for User ID!`);
        }
      } catch (fcmErr) {
        console.error('FCM Push Notification failed heavily (Logged in DB only):', fcmErr);
      }

      return res.status(HttpStatus.CREATED).json({ success: true, notification });
    } catch (error) {
      console.error('Error sending notification:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
    }
  }
}
