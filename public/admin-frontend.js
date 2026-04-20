document.addEventListener('DOMContentLoaded', () => {

    const evaluateSphereVisibility = () => {
        // Only run on Partner forms
        if (!window.location.href.includes('Partner/actions/new') && !window.location.href.includes('Partner/actions/edit')) {
            return;
        }

        const servicesBlock = document.querySelector('[data-testid="property-edit-partnerServices"]');
        const productsBlock = document.querySelector('[data-testid="property-edit-partnerProducts"]');
        const sphereBlock = document.querySelector('[data-testid="property-edit-companySphere"]');

        if (!sphereBlock || !servicesBlock || !productsBlock) return;

        // AdminJS v7 dynamically renders Selects. We can scan the text of the actual block which reads the visual selection!
        const textValue = sphereBlock.textContent || '';
        const isStore = textValue.toLowerCase().includes('store');
        const isService = textValue.toLowerCase().includes('service');
        const isBoth = textValue.toLowerCase().includes('both');

        if (isBoth) {
            servicesBlock.style.display = 'block';
            productsBlock.style.display = 'block';
        } else if (isStore) {
            productsBlock.style.display = 'block';
            servicesBlock.style.display = 'none';
        } else if (isService) {
            servicesBlock.style.display = 'block';
            productsBlock.style.display = 'none';
        } else {
            // Nothing selected!
            servicesBlock.style.display = 'none';
            productsBlock.style.display = 'none';
        }
    };

    const injectCreatePartnerLink = () => {
        // Find existing partners link recursively
        const links = Array.from(document.querySelectorAll('a'));
        const partnersLink = links.find(el => el.getAttribute('href') === '/admin/resources/Partner');
        
        if (partnersLink && !document.getElementById('injected-create-partner-link')) {
            const newLink = partnersLink.cloneNode(true);
            newLink.id = 'injected-create-partner-link';
            newLink.setAttribute('href', '/admin/resources/Partner/actions/new');
            
            // Recolor or restyle lightly to distinguish it
            newLink.style.opacity = '0.8';
            newLink.style.marginLeft = '10px'; // slight indent
            
            // AdminJS nests the text physically in varied elements depending on version, so we find the text node!
            const replaceText = (node) => {
                if (node.nodeType === 3 && node.nodeValue.trim() === 'Partners') {
                    node.nodeValue = 'Create Partner';
                } else {
                    Array.from(node.childNodes).forEach(child => replaceText(child));
                }
            };
            replaceText(newLink);
            
            partnersLink.parentNode.insertBefore(newLink, partnersLink.nextSibling);
        }
    };

    let dashboardInjected = false;
    const constructDashboard = async () => {
        if (!['/admin', '/admin/'].includes(window.location.pathname)) {
            dashboardInjected = false;
            return;
        }

        if (dashboardInjected) return;

        const rootElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, div, span, p'));
        const welcomeHeader = rootElements.find(el => el.textContent && el.textContent.trim() === 'Welcome on Board!');
        const addingResources = rootElements.find(el => el.textContent && el.textContent.trim() === 'Adding Resources');

        if (!welcomeHeader || !addingResources) return;

        dashboardInjected = true;

        // ── Find the root dashboard node ────────────────────────────────────
        let rootDashboardNode = welcomeHeader;
        for (let i = 0; i < 6; i++) {
            if (rootDashboardNode.parentElement) {
                rootDashboardNode = rootDashboardNode.parentElement;
                if (rootDashboardNode.innerText &&
                    rootDashboardNode.innerText.includes('Welcome on Board!') &&
                    rootDashboardNode.innerText.includes('Customize Actions')) {
                    break;
                }
            }
        }

        // Hide the default AdminJS content
        Array.from(rootDashboardNode.children).forEach(child => {
            if (child.style) child.style.display = 'none';
        });
        if (rootDashboardNode.style) {
            rootDashboardNode.style.background = 'transparent';
            rootDashboardNode.style.boxShadow = 'none';
        }

        // ── Inject the dashboard shell ──────────────────────────────────────
        const shell = document.createElement('div');
        shell.id = 'ew-dashboard';
        shell.style.cssText = 'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;padding:32px 40px;background:#f1f5f9;min-height:100vh;';
        shell.innerHTML = `
          <div style="margin-bottom:24px;">
            <h2 style="margin:0;font-size:24px;font-weight:900;color:#0f172a;">📊 EasyWay Dashboard</h2>
            <p style="margin:4px 0 0;color:#64748b;font-size:13px;">Platform analytics &amp; growth overview</p>
          </div>

          <!-- Period toolbar -->
          <div id="ew-toolbar" style="background:#fff;border-radius:14px;padding:14px 20px;margin-bottom:24px;box-shadow:0 1px 6px rgba(0,0,0,0.06);display:flex;flex-wrap:wrap;gap:10px;align-items:center;">
            ${['weekly','monthly','yearly','all','custom'].map(p => `
              <button data-period="${p}" class="ew-pill" style="padding:7px 18px;border-radius:22px;border:none;cursor:pointer;font-size:13px;font-weight:700;background:${p==='weekly'?'#1e293b':'#e2e8f0'};color:${p==='weekly'?'#fff':'#64748b'};transition:all 0.15s;">
                ${p==='weekly'?'Weekly':p==='monthly'?'Monthly':p==='yearly'?'Yearly':p==='all'?'All Time':'📅 Custom'}
              </button>`).join('')}
            <span id="ew-custom-inputs" style="display:none;align-items:center;gap:8px;">
              <input id="ew-from" type="date" style="padding:6px 10px;border-radius:8px;border:1px solid #e2e8f0;font-size:13px;outline:none;" />
              <span style="color:#64748b">→</span>
              <input id="ew-to" type="date" style="padding:6px 10px;border-radius:8px;border:1px solid #e2e8f0;font-size:13px;outline:none;" />
              <button id="ew-apply" style="padding:7px 18px;border-radius:22px;border:none;cursor:pointer;font-size:13px;font-weight:700;background:#3b82f6;color:#fff;">Apply</button>
            </span>
          </div>

          <!-- Stat cards -->
          <div style="display:flex;gap:18px;margin-bottom:28px;flex-wrap:wrap;">
            <div class="ew-card" style="flex:1;min-width:130px;background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.07);border-top:5px solid #3b82f6;padding:22px 20px;text-align:center;">
              <div style="font-size:28px;margin-bottom:6px;">👤</div>
              <div id="ew-users-total" style="font-size:40px;font-weight:900;color:#0f172a;line-height:1;">0</div>
              <div style="margin-top:8px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.08em;">Registered Users</div>
            </div>
            <div class="ew-card" style="flex:1;min-width:130px;background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.07);border-top:5px solid #22c55e;padding:22px 20px;text-align:center;">
              <div style="font-size:28px;margin-bottom:6px;">🤝</div>
              <div id="ew-partners-total" style="font-size:40px;font-weight:900;color:#0f172a;line-height:1;">0</div>
              <div style="margin-top:8px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.08em;">Active Partners</div>
            </div>
            <div class="ew-card" style="flex:1;min-width:130px;background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.07);border-top:5px solid #f59e0b;padding:22px 20px;text-align:center;">
              <div style="font-size:28px;margin-bottom:6px;">💳</div>
              <div id="ew-payments-total" style="font-size:40px;font-weight:900;color:#0f172a;line-height:1;">1450</div>
              <div style="margin-top:8px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.08em;">Platform Payments</div>
            </div>
          </div>

          <!-- Charts -->
          <div style="display:flex;flex-direction:column;gap:24px;">
            <!-- Users chart -->
            <div style="background:#fff;border-radius:18px;box-shadow:0 2px 16px rgba(0,0,0,0.07);border-left:6px solid #3b82f6;padding:28px 32px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
                <div>
                  <div style="font-size:17px;font-weight:800;color:#0f172a;">👤 Users Growth</div>
                  <div style="font-size:12px;color:#64748b;margin-top:2px;">New registrations over time</div>
                </div>
                <div id="ew-users-badge" style="background:#3b82f6;color:#fff;border-radius:12px;padding:6px 18px;font-size:22px;font-weight:900;">0</div>
              </div>
              <div id="ew-users-chart" style="width:100%;min-height:180px;"></div>
            </div>

            <!-- Partners chart -->
            <div style="background:#fff;border-radius:18px;box-shadow:0 2px 16px rgba(0,0,0,0.07);border-left:6px solid #22c55e;padding:28px 32px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
                <div>
                  <div style="font-size:17px;font-weight:800;color:#0f172a;">🤝 Partners Growth</div>
                  <div style="font-size:12px;color:#64748b;margin-top:2px;">New registrations over time</div>
                </div>
                <div id="ew-partners-badge" style="background:#22c55e;color:#fff;border-radius:12px;padding:6px 18px;font-size:22px;font-weight:900;">0</div>
              </div>
              <div id="ew-partners-chart" style="width:100%;min-height:180px;"></div>
            </div>
          </div>
        `;
        rootDashboardNode.appendChild(shell);

        // ── SVG bar chart renderer ──────────────────────────────────────────
        const renderChart = (containerId, data, color) => {
            const container = document.getElementById(containerId);
            if (!container) return;

            if (!data || data.length === 0) {
                container.innerHTML = `<div style="text-align:center;padding:40px;color:#94a3b8;font-size:13px;">No registrations in this period</div>`;
                return;
            }

            const W = 800, H = 160, PAD = 30;
            const max = Math.max(...data.map(d => d.value), 1);
            const n = data.length;
            const slotW = W / n;
            const barW = Math.max(6, Math.min(40, slotW * 0.6));

            const bars = data.map((d, i) => {
                const cx = slotW * i + slotW / 2;
                const barH = Math.max(2, Math.round((d.value / max) * H));
                const barY = H - barH;
                const label = n <= 15 || i % Math.ceil(n / 10) === 0
                    ? `<text x="${cx}" y="${H + 18}" text-anchor="middle" font-size="9" fill="#94a3b8">${d.label.length > 7 ? d.label.slice(5) : d.label}</text>`
                    : '';
                const valueLabel = d.value > 0
                    ? `<text x="${cx}" y="${barY - 4}" text-anchor="middle" font-size="9" fill="${color}" font-weight="700">${d.value}</text>`
                    : '';
                return `
                    <rect x="${cx - barW/2}" y="${barY}" width="${barW}" height="${barH}" fill="${color}" opacity="0.82" rx="4"/>
                    ${valueLabel}
                    ${label}`;
            }).join('');

            const gridLines = [0, 0.25, 0.5, 0.75, 1].map(t => {
                const y = H - Math.round(t * H);
                return `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#e2e8f0" stroke-width="1" ${t > 0 ? 'stroke-dasharray="4 4"' : ''}/>
                         <text x="2" y="${y - 3}" font-size="8" fill="#94a3b8">${Math.round(t * max)}</text>`;
            }).join('');

            container.innerHTML = `
                <svg viewBox="0 0 ${W} ${H + PAD}" width="100%" style="display:block;overflow:visible;">
                    ${gridLines}
                    ${bars}
                </svg>`;
        };

        // ── Spinner helpers ─────────────────────────────────────────────────
        const SPINNER_HTML = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:180px;gap:14px;">
            <div style="
              width:40px;height:40px;border-radius:50%;
              border:4px solid #e2e8f0;
              border-top-color:var(--ew-spinner-color,#3b82f6);
              animation:ewSpin 0.75s linear infinite;
            "></div>
            <div style="font-size:13px;color:#94a3b8;font-weight:500;">Loading chart data…</div>
          </div>`;

        // Inject keyframe once
        if (!document.getElementById('ew-spin-style')) {
            const s = document.createElement('style');
            s.id = 'ew-spin-style';
            s.textContent = '@keyframes ewSpin{to{transform:rotate(360deg)}}';
            document.head.appendChild(s);
        }

        const showLoading = () => {
            const uc = document.getElementById('ew-users-chart');
            const pc = document.getElementById('ew-partners-chart');
            if (uc) { uc.style.setProperty('--ew-spinner-color','#3b82f6'); uc.innerHTML = SPINNER_HTML; }
            if (pc) { pc.style.setProperty('--ew-spinner-color','#22c55e'); pc.innerHTML = SPINNER_HTML; }

            // Dim the stat value cards during load
            ['ew-users-total','ew-partners-total','ew-payments-total','ew-users-badge','ew-partners-badge'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.opacity = '0.35';
            });

            // Disable pills while fetching
            document.querySelectorAll('.ew-pill').forEach(b => b.disabled = true);
            const applyBtn = document.getElementById('ew-apply');
            if (applyBtn) applyBtn.disabled = true;
        };

        const hideLoading = () => {
            ['ew-users-total','ew-partners-total','ew-payments-total','ew-users-badge','ew-partners-badge'].forEach(id => {
                const el = document.getElementById(id);
                if (el) { el.style.opacity = '1'; el.style.transition = 'opacity 0.3s'; }
            });

            document.querySelectorAll('.ew-pill').forEach(b => b.disabled = false);
            const applyBtn = document.getElementById('ew-apply');
            if (applyBtn) applyBtn.disabled = false;
        };

        // ── Fetch and render ────────────────────────────────────────────────
        const loadData = async (period, from, to) => {
            showLoading();
            try {
                let url = `/api/admin/stats?period=${period}`;
                if (period === 'custom' && from && to) url += `&from=${from}&to=${to}`;
                const res = await fetch(url, { credentials: 'include' });
                const json = await res.json();

                document.getElementById('ew-users-total').textContent    = json.users    || 0;
                document.getElementById('ew-partners-total').textContent  = json.partners || 0;
                document.getElementById('ew-payments-total').textContent  = json.payments || 1450;
                document.getElementById('ew-users-badge').textContent     = json.users    || 0;
                document.getElementById('ew-partners-badge').textContent  = json.partners || 0;

                const chartData = json.chartData || [];
                renderChart('ew-users-chart',   chartData.map(b => ({ label: b.label, value: b.users })),    '#3b82f6');
                renderChart('ew-partners-chart', chartData.map(b => ({ label: b.label, value: b.partners })), '#22c55e');
            } catch (e) {
                console.error('Stats fetch error:', e);
                const uc = document.getElementById('ew-users-chart');
                const pc = document.getElementById('ew-partners-chart');
                const errHtml = `<div style="text-align:center;padding:50px;color:#f87171;font-size:13px;">⚠️ Failed to load data. Check server logs.</div>`;
                if (uc) uc.innerHTML = errHtml;
                if (pc) pc.innerHTML = errHtml;
            } finally {
                hideLoading();
            }
        };

        // Load initial data
        await loadData('weekly');

        // ── Wire period pills ───────────────────────────────────────────────
        let activePeriod = 'weekly';
        document.querySelectorAll('.ew-pill').forEach(btn => {
            btn.addEventListener('click', async () => {
                const p = btn.getAttribute('data-period');
                activePeriod = p;

                // Update pill styles
                document.querySelectorAll('.ew-pill').forEach(b => {
                    b.style.background = '#e2e8f0';
                    b.style.color      = '#64748b';
                });
                btn.style.background = '#1e293b';
                btn.style.color      = '#fff';

                // Toggle custom inputs
                const customInputs = document.getElementById('ew-custom-inputs');
                customInputs.style.display = p === 'custom' ? 'flex' : 'none';

                if (p !== 'custom') await loadData(p);
            });
        });

        // Wire custom Apply button
        document.getElementById('ew-apply').addEventListener('click', async () => {
            const from = document.getElementById('ew-from').value;
            const to   = document.getElementById('ew-to').value;
            if (from && to) await loadData('custom', from, to);
        });
    };


    let userProfileInjected = false;
    const constructUserProfile = async () => {
        const match = window.location.pathname.match(/\/admin\/resources\/User\/records\/([a-zA-Z0-9\-]+)\/show/);
        if (!match) {
            userProfileInjected = false;
            return;
        }

        if (userProfileInjected) return;

        // AdminJS usually puts the show fields in a Box container natively
        const emailLabel = Array.from(document.querySelectorAll('label')).find(el => el.textContent === 'Email' || el.textContent === 'email');
        if (!emailLabel) return; // Wait to paint

        userProfileInjected = true;
        const userId = match[1];

        try {
            const response = await fetch('/api/admin/users/' + userId + '/details');
            const data = await response.json();

            const user = data.user;
            const vehicles = data.vehicles || [];

            // We hide the default text dump gracefully without crashing React
            let contentWrapper = emailLabel.closest('section');
            if (contentWrapper) {
                 Array.from(contentWrapper.children).forEach(child => {
                     if (child.style && child.tagName !== 'STYLE') child.style.display = 'none';
                 });
                 
                 // Erase background styling
                 if (contentWrapper.style) {
                     contentWrapper.style.background = 'transparent';
                     contentWrapper.style.boxShadow = 'none';
                 }

                 const profileContainer = document.createElement('div');
                 
                 // Generate HTML mapping natively!
                 let vehiclesHtml = vehicles.map(v => `
                    <div style="background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; overflow: hidden; border: 1px solid #e9ecef;">
                        <div style="background: #f8f9fa; padding: 15px 25px; border-bottom: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center;">
                            <h3 style="margin: 0; font-size: 1.25rem; color: #212529;">
                                ${v.year} ${v.make} ${v.model} 
                                <span style="font-size: 0.85rem; background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 20px; font-weight: 500; margin-left: 10px;">${v.plateNumber || 'No Plate'}</span>
                            </h3>
                            <span style="font-size: 0.9rem; color: #6c757d; font-weight: 600;">Mileage: ${v.odometer} km</span>
                        </div>
                        <div style="padding: 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            
                            <!-- Maintenance History -->
                            <div>
                                <h4 style="margin-top: 0; color: #495057; font-size: 1rem; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">Maintenance History</h4>
                                ${(v.serviceRecords && v.serviceRecords.length > 0) ? v.serviceRecords.map(r => `
                                    <div style="padding: 10px 0; border-bottom: 1px solid #f1f3f5;">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <strong style="color: #343a40;">${r.title}</strong>
                                            <span style="font-size: 0.8rem; background: ${r.status === 'completed' ? '#d1e7dd' : '#fff3cd'}; color: ${r.status === 'completed' ? '#0f5132' : '#856404'}; padding: 2px 6px; border-radius: 4px; text-transform: capitalize;">${r.status}</span>
                                        </div>
                                        <div style="font-size: 0.85rem; color: #6c757d; margin-top: 5px;">Scheduled: ${r.scheduledDate || 'N/A'}</div>
                                    </div>
                                `).join('') : '<p style="color: #adb5bd; font-size: 0.9rem; font-style: italic;">No records found.</p>'}
                            </div>

                            <!-- AI Interactions -->
                            <div>
                                <h4 style="margin-top: 0; color: #495057; font-size: 1rem; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">AI Diagnostics</h4>
                                ${(v.aiAnalyses && v.aiAnalyses.length > 0) ? v.aiAnalyses.map(a => `
                                    <div style="padding: 10px 0; border-bottom: 1px solid #f1f3f5;">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <strong style="color: #343a40;">Health Score: ${a.healthScore || 'N/A'}/100</strong>
                                            <span style="font-size: 0.8rem; background: ${a.status === 'completed' ? '#cfe2ff' : '#e2e3e5'}; color: #084298; padding: 2px 6px; border-radius: 4px; text-transform: capitalize;">${a.status}</span>
                                        </div>
                                        <div style="font-size: 0.85rem; color: #6c757d; margin-top: 8px; line-height: 1.3;">${a.aiTip || 'Processing...'}</div>
                                    </div>
                                `).join('') : '<p style="color: #adb5bd; font-size: 0.9rem; font-style: italic;">No diagnostics requested.</p>'}
                            </div>

                        </div>
                    </div>
                 `).join('');

                 if (vehicles.length === 0) vehiclesHtml = `<div style="text-align: center; padding: 40px; background: white; border-radius: 12px; border: 1px dashed #ced4da;"><p style="color: #6c757d; font-size: 1.1rem; margin: 0;">This user has not registered any vehicles yet.</p></div>`;

                 profileContainer.innerHTML = `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 1200px; margin: 0 auto; width: 100%;">
                        
                        <!-- User Static Identity Header -->
                        <div style="background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%); border-radius: 12px; padding: 30px; color: white; margin-bottom: 40px; box-shadow: 0 10px 20px rgba(13, 110, 253, 0.15); display: flex; justify-content: space-between; align-items: flex-end;">
                            <div>
                                <h1 style="margin: 0 0 12px 0; font-size: 2.8rem; font-weight: 700; color: white; line-height: 1.1;">${user.name} ${user.surname}</h1>
                                <p style="margin: 0; font-size: 1.1rem; opacity: 0.9; line-height: 1.5; font-weight: 500;">${user.email} &nbsp;&bull;&nbsp; ${user.phone}</p>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 0.85rem; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Onboarding Status</div>
                                <div style="background: rgba(255,255,255,0.2); backdrop-filter: blur(5px); padding: 5px 12px; border-radius: 20px; font-weight: 600; text-transform: capitalize; margin-bottom: 15px; display: inline-block;">${user.onboardingStatus}</div>
                                <br/>
                                <button onclick="window.constructDirectMessageModal('${user.id}')" style="background: #ffffff; color: #0d6efd; border: none; padding: 8px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: all 0.2s;">
                                    <span style="margin-right: 5px;">✉️</span> Direct Message
                                </button>
                            </div>
                        </div>

                        <!-- Vehicles Fleet Structure -->
                        <div style="margin-bottom: 20px;">
                            <h2 style="font-size: 1.5rem; color: #212529; margin-bottom: 20px; font-weight: 700; border-bottom: 3px solid #e9ecef; padding-bottom: 10px; display: inline-block;">Registered Fleet Ecosystem</h2>
                        </div>
                        
                        ${vehiclesHtml}

                    </div>
                 `;

                 // Hunt down the generic header above that explicitly says "user.email" and hide it dynamically
                 Array.from(document.querySelectorAll('h1, h2, h3, div')).forEach(el => {
                     if (el.textContent && el.textContent.trim() === user.email && el.tagName !== 'P') {
                         let headerBox = el;
                         for(let i=0; i<3; i++) {
                             if (headerBox && headerBox.parentElement && headerBox.parentElement.style) {
                                 headerBox = headerBox.parentElement;
                                 if (headerBox.getAttribute('data-css') === 'Box') {
                                     headerBox.style.display = 'none';
                                 }
                             }
                         }
                     }
                 });

                 contentWrapper.appendChild(profileContainer);

                 // Globally attach Modal Logic specifically natively once
                 if (!window.constructDirectMessageModal) {
                     window.constructDirectMessageModal = (uid) => {
                         let existing = document.getElementById('easyway-dm-modal');
                         if (existing) existing.remove();

                         const modalStr = `
                             <div id="easyway-dm-modal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 999999; display: flex; align-items: center; justify-content: center;">
                                 <div style="background: white; border-radius: 16px; padding: 30px; width: 450px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); position: relative;">
                                     <h2 style="margin: 0 0 20px 0; font-size: 1.5rem; color: #212529; border-bottom: 2px solid #f1f3f5; padding-bottom: 10px;">Dispatch Custom Message</h2>
                                     
                                     <label style="display: block; margin-bottom: 8px; font-size: 0.9rem; font-weight: 600; color: #495057;">Notification Platform Channel</label>
                                     <select id="dm-type" style="width: 100%; padding: 10px; margin-bottom: 20px; border-radius: 8px; border: 1px solid #ced4da; font-size: 1rem; color: #212529;">
                                         <option value="push">Mobile Push Notification (Firebase)</option>
                                         <option value="email">Direct Account Email</option>
                                         <option value="sms">Direct SMS Gateway</option>
                                     </select>

                                     <label style="display: block; margin-bottom: 8px; font-size: 0.9rem; font-weight: 600; color: #495057;">Message Title / Subject</label>
                                     <input id="dm-title" type="text" placeholder="e.g. Exclusive Promo inside!" style="width: 100%; padding: 10px; margin-bottom: 20px; border-radius: 8px; border: 1px solid #ced4da; font-size: 1rem; color: #212529;" />

                                     <label style="display: block; margin-bottom: 8px; font-size: 0.9rem; font-weight: 600; color: #495057;">Message Body (Supports Plain Text)</label>
                                     <textarea id="dm-body" rows="4" placeholder="Write your message precisely here..." style="width: 100%; padding: 10px; margin-bottom: 20px; border-radius: 8px; border: 1px solid #ced4da; font-size: 1rem; color: #212529; resize: vertical;"></textarea>
                                     
                                     <div id="dm-error" style="color: #dc3545; font-size: 0.85rem; margin-bottom: 15px; display: none; font-weight: 500;">Failed: All fields are mandatory!</div>

                                     <div style="display: flex; justify-content: flex-end; gap: 10px;">
                                         <button onclick="document.getElementById('easyway-dm-modal').remove()" style="padding: 10px 20px; background: #e9ecef; border: none; border-radius: 8px; font-weight: 600; color: #495057; cursor: pointer;">Cancel</button>
                                         <button id="dm-submit-btn" style="padding: 10px 20px; background: #0d6efd; border: none; border-radius: 8px; font-weight: 600; color: white; cursor: pointer;">Dispatch Message 🚀</button>
                                     </div>
                                 </div>
                             </div>
                         `;

                         document.body.insertAdjacentHTML('beforeend', modalStr);

                         document.getElementById('dm-submit-btn').addEventListener('click', async (e) => {
                             const btn = e.target;
                             const type = document.getElementById('dm-type').value;
                             const title = document.getElementById('dm-title').value.trim();
                             const message = document.getElementById('dm-body').value.trim();
                             const errLabel = document.getElementById('dm-error');

                             if (!title || !message) {
                                 errLabel.style.display = 'block';
                                 return;
                             }

                             errLabel.style.display = 'none';
                             btn.innerText = 'Dispatching...';
                             btn.disabled = true;
                             btn.style.opacity = '0.7';

                             try {
                                 const res = await fetch('/api/admin/users/' + uid + '/notify', {
                                     method: 'POST',
                                     headers: { 'Content-Type': 'application/json' },
                                     body: JSON.stringify({ type, title, message })
                                 });

                                 if (res.ok) {
                                     btn.style.background = '#198754';
                                     btn.innerText = 'Sent Successfully! ✅';
                                     setTimeout(() => document.getElementById('easyway-dm-modal').remove(), 1200);
                                 } else {
                                     throw new Error("HTTP " + res.status);
                                 }
                             } catch (error) {
                                  console.error("DM Error", error);
                                  errLabel.innerText = 'Server disconnected! Check logs.';
                                  errLabel.style.display = 'block';
                                  btn.innerText = 'Try Again';
                                  btn.disabled = false;
                                  btn.style.opacity = '1';
                             }
                         });
                     };
                 }
            }
        } catch(e) {
            console.error("User Profile Construct Failed", e);
        }
    };

    const observer = new MutationObserver(() => {
        evaluateSphereVisibility();
        injectCreatePartnerLink();
        constructDashboard();
        constructUserProfile();
    });

    observer.observe(document.body, { childList: true, subtree: true });
});
