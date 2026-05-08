import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import * as AdminJSTypeorm from '@adminjs/typeorm';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { MoreThanOrEqual } from 'typeorm';
import { componentLoader, dashboardComponent, blankDashboardComponent } from './component-loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { Admin } from './entities/admin.entity.js';
import { User } from './entities/user.entity.js';
import { Partner } from './entities/partner.entity.js';
import { PartnerAuth } from './entities/partner-auth.entity.js';
import { PartnerContact } from './entities/partner-contact.entity.js';
import { PartnerProduct } from './entities/partner-product.entity.js';
import { PartnerService } from './entities/partner-service.entity.js';
import { Vehicle } from './entities/vehicle.entity.js';
import { AiAnalysis } from './entities/ai-analysis.entity.js';
import { ServiceRecord } from './entities/service-record.entity.js';
import { Notification } from './entities/notification.entity.js';
import { DeviceToken } from './entities/device-token.entity.js';
import { Setting } from './entities/setting.entity.js';
import { PartnerResourceOptions } from './admin/resources/partner.resource.js';
import { PartnerServiceResourceOptions } from './admin/resources/partner-service.resource.js';
import { PartnerProductResourceOptions } from './admin/resources/partner-product.resource.js';
import { PartnerApplication } from './entities/partner-application.entity.js';
import { MaintenancePrediction } from './entities/maintenance-prediction.entity.js';
import { PartnerSlot } from './entities/partner-slot.entity.js';
import { ServiceCenter } from './entities/service-center.entity.js';
import { PartnerLocation } from './entities/partner-location.entity.js';
import { UserController } from './user.controller.js';

AdminJS.registerAdapter({
  Resource: AdminJSTypeorm.Resource,
  Database: AdminJSTypeorm.Database,
});




export const adminJsOptions = {
  rootPath: '/admin',
  componentLoader,
  resources: [
    { 
      resource: User, 
      options: { 
        navigation: { name: 'Users', icon: 'User' }, 
        properties: { passwordHash: { isVisible: false } },
        sort: {
          sortBy: 'createdAt',
          direction: 'desc'
        },
        actions: {
            new: { isAccessible: false } // Only mobile systems can register users!
        }
      } 
    },
    PartnerResourceOptions,
    { resource: PartnerAuth, options: { navigation: false } },
    { resource: PartnerContact, options: { navigation: false } },
    { resource: ServiceCenter, options: { navigation: false } }, // Hidden — needed for TypeORM relation resolution
    PartnerServiceResourceOptions,
    PartnerProductResourceOptions,
    {
      resource: PartnerLocation,
      options: {
        navigation: { name: 'Partners', icon: 'MapPin' },
        titleProperty: 'address',  // Show address in reference dropdowns
        sort: { sortBy: 'createdAt', direction: 'desc' },
        listProperties: ['partnerId', 'address', 'type', 'lat', 'lng', 'createdAt'],
        showProperties: ['id', 'partnerId', 'address', 'lat', 'lng', 'type', 'createdAt', 'updatedAt'],
        editProperties: ['partnerId', 'address', 'lat', 'lng', 'type'],
        filterProperties: ['partnerId', 'type'],
        properties: {
          type: {
            availableValues: [
              { value: 'main', label: '🏢 Main Branch' },
              { value: 'branch', label: '🏪 Branch' },
            ],
          },
          id: { isVisible: { list: false, filter: false, show: true, edit: false } },
          createdAt: { isVisible: { list: true, filter: true, show: true, edit: false } },
          updatedAt: { isVisible: { list: false, filter: false, show: true, edit: false } },
        },
      },
    },
    {
      resource: PartnerApplication,
      options: {
        navigation: { name: 'Partners', icon: 'Send' },
        sort: { sortBy: 'createdAt', direction: 'desc' },
        properties: {
          id: { isVisible: { list: false, filter: false, show: true, edit: false } },
          about: { type: 'textarea' },
          status: {
            availableValues: [
              { value: 'pending', label: '⏳ Pending' },
              { value: 'approved', label: '✅ Approved' },
              { value: 'rejected', label: '❌ Rejected' },
            ],
          },
          createdAt: { isVisible: { list: true, filter: true, show: true, edit: false } },
        },
        actions: {
          new: { isAccessible: false },
          delete: { isAccessible: true },
        },
      },
    },
    { 
      resource: Admin, 
      options: { 
        navigation: { name: 'Settings', icon: 'Settings' },
        properties: {
          passwordHash: { type: 'password', isVisible: { list: false, filter: false, show: false, edit: true } }
        }
      } 
    },
    { 
      resource: Setting, 
      options: { 
        navigation: { name: 'Settings', icon: 'Settings' },
        properties: {
          id: { isVisible: { list: false, filter: false, show: false, edit: false } },
          createdDate: { isVisible: { list: false, filter: false, show: false, edit: false } },
          modifiedDate: { isVisible: { list: false, filter: false, show: false, edit: false } },
        }
      } 
    },
    {
      resource: MaintenancePrediction,
      options: {
        navigation: { name: 'Users', icon: 'Tool' },
        sort: { sortBy: 'predictedDate', direction: 'asc' },
        properties: {
          partsNeeded: { type: 'json' },
          servicesNeeded: { type: 'json' },
        }
      }
    },
    {
      resource: PartnerSlot,
      options: {
        navigation: { name: 'Partners', icon: 'Calendar' },
        sort: { sortBy: 'startTime', direction: 'desc' },
      }
    },
  ],
  branding: {
    companyName: 'EasyWay Dashboard',
    softwareBrothers: false,
    logo: '', 
  },
  dashboard: {
    component: blankDashboardComponent,
  },
  pages: {
    'Partners analytics': {
      component: dashboardComponent,
      icon: 'Activity',
      handler: async (request, response, context) => {
        const { period = 'weekly', from, to } = request.query as Record<string, string>;

        // ── Determine date range ───────────────────────────────────────────
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
          startDate.setMonth(now.getMonth() - 1);
        } else if (period === 'yearly') {
          startDate.setFullYear(now.getFullYear() - 1);
          bucketFormat = 'month';
        } else if (period === 'all') {
          startDate = new Date('2024-01-01');
          bucketFormat = 'month';
        }
        startDate.setHours(0, 0, 0, 0);
        const endDate = period === 'custom' && to ? new Date(to) : now;

        // ── Helper: generate all date labels in range ──────────────────────
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

        // ── Raw user rows ──────────────────────────────────────────────────
        const userRows: { day: string; count: string }[] = await User
          .getRepository()
          .createQueryBuilder('u')
          .select(
            bucketFormat === 'month'
              ? `TO_CHAR(u.created_at, 'YYYY-MM')`
              : `TO_CHAR(u.created_at, 'YYYY-MM-DD')`,
            'day'
          )
          .addSelect('COUNT(*)', 'count')
          .where('u.created_at >= :start AND u.created_at <= :end', { start: startDate, end: endDate })
          .groupBy('day')
          .orderBy('day', 'ASC')
          .getRawMany();

        // ── Raw partner rows ───────────────────────────────────────────────
        const partnerRows: { day: string; count: string }[] = await Partner
          .createQueryBuilder('p')
          .select(
            bucketFormat === 'month'
              ? `TO_CHAR(p.created_at, 'YYYY-MM')`
              : `TO_CHAR(p.created_at, 'YYYY-MM-DD')`,
            'day'
          )
          .addSelect('COUNT(*)', 'count')
          .where('p.created_at >= :start AND p.created_at <= :end', { start: startDate, end: endDate })
          .groupBy('day')
          .orderBy('day', 'ASC')
          .getRawMany();

        // ── Merge into buckets ─────────────────────────────────────────────
        userRows.forEach(r => { if (buckets[r.day]) buckets[r.day].users = parseInt(r.count); });
        partnerRows.forEach(r => { if (buckets[r.day]) buckets[r.day].partners = parseInt(r.count); });

        const chartData = Object.entries(buckets).map(([label, v]) => ({
          label,
          users: v.users,
          partners: v.partners,
        }));

        // ── Summary totals for the top cards ──────────────────────────────
        const usersTotal = await User.count({ where: { createdAt: MoreThanOrEqual(startDate) } });
        const partnersTotal = await Partner.count({ where: { createdAt: MoreThanOrEqual(startDate) } });

        return {
           users: usersTotal,
           partners: partnersTotal,
           payments: 1450,
           chartData,
           period,
        };
      }
    }
  },
  assets: {
    scripts: ['/admin-frontend.js'] // Interjects purely custom graphical UI manipulation code
  }
};

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: parseInt(process.env.DB_PORT ?? '5432', 10),
        username: process.env.DB_USERNAME ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'postgres',
        database: process.env.DB_NAME ?? 'easyway',
        entities: [Admin, User, Partner, PartnerAuth, PartnerContact, PartnerProduct, PartnerService,
        Vehicle,
        AiAnalysis,
        ServiceRecord,
        Notification,
        DeviceToken,
        Setting,
        PartnerApplication,
        MaintenancePrediction,
        PartnerSlot,
        ServiceCenter,
        PartnerLocation
      ],  synchronize: false,
        logging: false,
      }),
    }),
  ],
  controllers: [UserController],
})
export class AppModule {}
