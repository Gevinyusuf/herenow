<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HereNow - Event Management</title>
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Font Loading -->
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=Lalezar&display=swap');
        .font-brand { font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: -0.02em; }
        .font-logo { font-family: 'Lalezar', system-ui; }
        .font-sans { font-family: 'Inter', sans-serif; }
        
        :root { --color-herenow-orange: #FF6B3D; }
        .bg-herenow { background: linear-gradient(135deg, #f8fafc, #ffffff); }
        .shadow-herenow { box-shadow: 0 10px 30px -5px rgba(255, 107, 61, 0.3); }
        .glass-card { background-color: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.5); }
        
        /* Active Tab Indicator Style */
        .tab-active {
            color: #0f172a; /* slate-900 */
            font-weight: 600;
            border-bottom: 4px solid var(--color-herenow-orange);
        }
        .tab-inactive {
            color: #64748b; /* slate-500 */
            font-weight: 500;
            border-bottom: 4px solid transparent;
        }
        .tab-inactive:hover { color: #334155; }

        /* Table Styles */
        .guest-table th { background-color: rgba(248, 250, 252, 0.8); font-size: 0.875rem; font-weight: 700; color: #1e293b; text-transform: uppercase; padding: 1rem 1.5rem; text-align: left; }
        .guest-table td { padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.5); }
        
        /* Form Elements Style */
        .form-input {
            background-color: rgba(255, 255, 255, 0.7);
            border: 1px solid rgba(226, 232, 240, 0.8);
            transition: all 0.2s;
        }
        .form-input:focus {
            background-color: #fff;
            outline: none;
            border-color: var(--color-herenow-orange);
            box-shadow: 0 0 0 3px rgba(255, 107, 61, 0.1);
        }

        /* Custom Scrollbar */
        .gallery-scroll::-webkit-scrollbar { width: 6px; }
        .gallery-scroll::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 3px; }

        /* Modal Transition */
        .modal { transition: opacity 0.3s ease-in-out; }
        .modal-content { transition: transform 0.3s ease-in-out; }
        .hidden-modal { opacity: 0; pointer-events: none; }
        .hidden-modal .modal-content { transform: scale(0.95); }
        .visible-modal { opacity: 1; pointer-events: auto; }
        .visible-modal .modal-content { transform: scale(1); }

        /* Editor Styles */
        .editor-content { min-height: 240px; outline: none; overflow-y: auto; line-height: 1.6; }
        .editor-content h1 { font-size: 1.75rem; font-weight: 800; margin-bottom: 0.5em; margin-top: 0.2em; color: #1e293b; line-height: 1.2; }
        .editor-content h2 { font-size: 1.4rem; font-weight: 700; margin-bottom: 0.4em; margin-top: 0.8em; color: #334155; line-height: 1.3; }
        .editor-content h3 { font-size: 1.15rem; font-weight: 600; margin-bottom: 0.3em; margin-top: 0.6em; color: #475569; }
        .editor-content p { margin-bottom: 0.8em; color: #475569; }
        .editor-content a { color: var(--color-herenow-orange); text-decoration: underline; cursor: pointer; font-weight: 500; }
        .editor-content ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 0.8em; }
        .editor-content ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 0.8em; }
        .editor-content blockquote { border-left: 4px solid #e2e8f0; padding-left: 1em; color: #64748b; font-style: italic; margin-bottom: 0.8em; }
        
        .toolbar-btn { padding: 0.375rem; border-radius: 0.375rem; color: #475569; transition: all 0.15s; }
        .toolbar-btn:hover { background-color: #f1f5f9; color: #1e293b; }
        .toolbar-separator { width: 1px; height: 1.25rem; background-color: #cbd5e1; margin: 0 0.25rem; }

        /* Editable Areas in Planning */
        [contenteditable="true"]:focus {
            outline: 2px dashed #FF6B3D;
            outline-offset: 4px;
            border-radius: 4px;
        }
        [contenteditable="true"]:hover {
            background-color: rgba(255,255,255,0.5);
            border-radius: 4px;
            cursor: text;
        }

        /* Insight Filters */
        .insight-filter.active-filter {
            background-color: var(--color-herenow-orange);
            color: white;
        }
        .insight-filter:not(.active-filter):hover {
            background-color: #f1f5f9;
        }
    </style>
</head>
<body class="bg-herenow min-h-screen p-6 sm:p-10 lg:p-12 font-sans text-base">

    <div class="max-w-6xl mx-auto">
        
        <!-- HEADER -->
        <header class="mb-10">
            <div class="flex justify-between items-center mb-6">
                <div class="text-4xl font-logo" style="color: var(--color-herenow-orange);">HereNow</div>
                <div class="flex items-center space-x-4">
                    <span class="text-slate-500 text-sm hidden sm:inline">4:54 PM GMT+8</span>
                    <button class="px-4 py-2 text-sm font-semibold rounded-xl text-white hover:opacity-90 transition" style="background-color: var(--color-herenow-orange);">Create Event</button>
                </div>
            </div>

            <h1 class="text-4xl sm:text-5xl font-extrabold text-slate-900 font-brand tracking-tighter mb-2">11th Anniversary Celebration</h1>
            
            <div class="flex flex-wrap items-center justify-between mb-6 gap-4">
                <p class="text-lg sm:text-xl text-slate-500 flex items-center">
                    <span>Event Management / </span>
                    <span id="currentTabName" class="ml-1 font-medium text-slate-700">Overview</span>
                </p>
                
                <a href="#" target="_blank" class="flex items-center space-x-2 px-4 py-2 rounded-xl border-2 transition duration-200 hover:bg-orange-50 group" style="border-color: var(--color-herenow-orange);">
                    <svg class="w-5 h-5 group-hover:scale-110 transition-transform" style="color: var(--color-herenow-orange);" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    <span class="font-bold text-sm" style="color: var(--color-herenow-orange);">View Live Page</span>
                </a>
            </div>
            
            <nav class="overflow-x-auto whitespace-nowrap -mb-1 border-b border-slate-200">
                <div class="inline-flex space-x-8">
                    <button onclick="switchTab('overview')" id="btn-overview" class="tab-active pb-3 text-lg transition-colors">Overview</button>
                    <button onclick="switchTab('guests')" id="btn-guests" class="tab-inactive pb-3 text-lg transition-colors">Guests</button>
                    <button onclick="switchTab('content')" id="btn-content" class="tab-inactive pb-3 text-lg transition-colors">Content</button>
                    <button onclick="switchTab('planning')" id="btn-planning" class="tab-inactive pb-3 text-lg transition-colors">Planning</button>
                    <button onclick="switchTab('insights')" id="btn-insights" class="tab-inactive pb-3 text-lg transition-colors">Insights</button>
                    <!-- Removed More Button -->
                </div>
            </nav>
        </header>

        <!-- CONTENT AREA -->
        <main>
            <!-- TAB 1: OVERVIEW -->
            <div id="view-overview" class="tab-view block">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <section class="lg:col-span-2 space-y-8">
                        <div class="grid grid-cols-3 gap-4">
                            <div class="glass-card rounded-2xl p-5">
                                <span class="text-sm font-medium text-slate-500">Registered</span>
                                <div class="text-3xl font-extrabold font-brand text-slate-900 mt-1">128</div>
                                <span class="text-xs text-green-600 font-medium">+12 Today</span>
                            </div>
                            <div class="glass-card rounded-2xl p-5">
                                <span class="text-sm font-medium text-slate-500">Revenue</span>
                                <div class="text-3xl font-extrabold font-brand text-slate-900 mt-1">$ 12,800</div>
                                <span class="text-xs text-green-600 font-medium">+$ 1,280 Today</span>
                            </div>
                            <div class="glass-card rounded-2xl p-5">
                                <span class="text-sm font-medium text-slate-500">Checked In</span>
                                <div class="text-3xl font-extrabold font-brand text-slate-900 mt-1">95</div>
                                <span class="text-xs text-orange-600 font-medium">74% Rate</span>
                            </div>
                        </div>

                        <div class="glass-card rounded-3xl p-6 shadow-herenow flex flex-col gap-6">
                            <h2 class="text-3xl font-bold text-slate-900 font-brand">Event Details</h2>
                            <div class="flex flex-col xl:flex-row gap-6">
                                <div class="w-full xl:w-1/2 space-y-4">
                                    <div class="flex gap-4">
                                        <div class="w-24 h-24 rounded-2xl bg-slate-200 flex items-center justify-center flex-shrink-0 text-slate-400">
                                            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L14 16m-2-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                        </div>
                                        <div>
                                            <div class="flex items-center space-x-2 mb-1">
                                                <span class="px-2 py-0.5 rounded text-xs font-bold text-white" style="background-color: var(--color-herenow-orange);">NOV 24</span>
                                                <span class="text-slate-900 font-bold">Monday</span>
                                            </div>
                                            <p class="text-slate-500 text-sm">5:00 PM - 6:00 PM GMT+8</p>
                                            <div class="mt-2 text-sm text-slate-600 flex items-start gap-1">
                                                <svg class="w-4 h-4 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0l-4.243-4.243m.707-10.707l4.243 4.243a1.998 1.998 0 002.828 0l4.243-4.243m-9.9-1.414l3.535-3.535m0 0l3.535 3.535M9.899 9.899l4.243-4.243M9.899 14.142l4.243 4.243"/></svg>
                                                <span>456 Main Street, New York, USA</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button class="w-full py-3 rounded-xl text-white font-bold shadow-lg hover:opacity-90 transition" style="background-color: var(--color-herenow-orange);">Go to Check-in</button>
                                </div>
                                <div class="w-full xl:w-1/2 space-y-4 xl:pl-6 xl:border-l border-slate-200">
                                    <h3 class="text-xl font-bold text-slate-900">Quick Actions</h3>
                                    <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <span class="text-sm font-medium text-orange-600 truncate mr-2">herenow.events/e/et9wrmvr</span>
                                        <button onclick="copyLink(this)" class="text-sm font-semibold text-slate-600 hover:text-slate-900">Copy</button>
                                    </div>
                                    <button class="w-full py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-2">Edit Details</button>
                                </div>
                            </div>
                        </div>
                    </section>
                    <aside class="lg:col-span-1">
                       <div class="glass-card rounded-3xl p-6">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-2xl font-bold text-slate-900 font-brand">Hosts</h3>
                                <button class="text-sm font-semibold text-white px-3 py-1 rounded-lg hover:opacity-90" style="background-color: var(--color-herenow-orange);">+ Add</button>
                            </div>
                            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">TZ</div>
                                    <div>
                                        <p class="text-sm font-bold text-slate-900">Tim Zhang</p>
                                        <span class="text-[10px] uppercase font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded">Creator</span>
                                    </div>
                                </div>
                            </div>
                       </div>
                    </aside>
                </div>
                
                <!-- Danger Zone (Low Visibility Buttons) -->
                <div class="mt-12 pt-6 border-t border-slate-200 flex justify-end gap-6 opacity-60 hover:opacity-100 transition-opacity">
                    <button onclick="pauseEvent()" class="text-sm font-medium text-slate-500 hover:text-amber-600 transition">Pause Registrations</button>
                    <button onclick="cancelEvent()" class="text-sm font-medium text-slate-500 hover:text-red-600 transition">Cancel Event</button>
                </div>
            </div>

            <!-- TAB 2: GUESTS -->
            <div id="view-guests" class="tab-view hidden">
                <div class="flex flex-col gap-6">
                    <div class="glass-card p-6 rounded-3xl flex flex-col gap-6">
                        <div class="flex justify-between items-center flex-wrap gap-4">
                            <div>
                                <h2 class="text-3xl font-bold text-slate-900 font-brand mb-1">Guests (<span id="guestCountDisplay">0</span>)</h2>
                                <p class="text-slate-500">Manage registered attendees.</p>
                            </div>
                            <button onclick="exportCsv()" class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold hover:opacity-90 shadow-lg transition" style="background-color: var(--color-herenow-orange);">
                                <span>Export CSV</span>
                            </button>
                        </div>
                        <div class="flex flex-col md:flex-row gap-4 justify-between">
                            <input type="text" id="searchInput" oninput="filterGuests()" class="form-input block flex-grow w-full pl-4 pr-3 py-2.5 rounded-xl text-slate-700 placeholder-slate-400" placeholder="Search name or email...">
                            <div class="flex gap-3">
                                <select id="ticketFilter" onchange="filterGuests()" class="form-input rounded-xl py-2.5 pl-3 pr-10 text-slate-700 cursor-pointer">
                                    <option value="all">All Tickets</option>
                                    <option value="VIP">VIP</option>
                                    <option value="General">General</option>
                                    <option value="Early Bird">Early Bird</option>
                                </select>
                                <select id="statusFilter" onchange="filterGuests()" class="form-input rounded-xl py-2.5 pl-3 pr-10 text-slate-700 cursor-pointer">
                                    <option value="all">All Status</option>
                                    <option value="checkedIn">Checked In</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="glass-card rounded-3xl overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="w-full guest-table">
                                <thead><tr><th>Guest</th><th>Email</th><th>Ticket Type</th><th>Reg. Date</th><th>Amount</th><th>Status</th></tr></thead>
                                <tbody id="guests-body" class="text-slate-700 text-sm"></tbody>
                            </table>
                        </div>
                        <div id="emptyState" class="hidden p-12 text-center text-slate-500">
                            <p>No guests found matching your filters.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TAB 3: CONTENT -->
            <div id="view-content" class="tab-view hidden">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <section class="lg:col-span-2 space-y-8">
                        <div class="glass-card rounded-3xl p-6 shadow-herenow relative">
                            <div class="flex justify-between items-center mb-4">
                                <div class="flex items-center gap-3">
                                    <h2 class="text-2xl font-bold text-slate-900 font-brand">Event Details</h2>
                                    <button onclick="openModal('aiModal')" class="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-1.5 rounded-full transition hover:opacity-90 shadow-sm" style="background: linear-gradient(90deg, #FF6B3D 0%, #FF8E53 100%);">
                                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                        AI Magic
                                    </button>
                                </div>
                                <button class="text-sm font-semibold text-white px-4 py-1.5 rounded-lg hover:opacity-90 transition" style="background-color: var(--color-herenow-orange);">Save</button>
                            </div>
                            <div class="flex items-center gap-1 mb-3 pb-3 border-b border-slate-200 flex-wrap">
                                <button onclick="execCmd('formatBlock', 'H1')" class="toolbar-btn font-extrabold text-sm" title="Heading 1">H1</button>
                                <button onclick="execCmd('formatBlock', 'H2')" class="toolbar-btn font-bold text-sm" title="Heading 2">H2</button>
                                <button onclick="execCmd('bold')" class="toolbar-btn font-bold" title="Bold">B</button>
                                <button onclick="execCmd('italic')" class="toolbar-btn italic" title="Italic">I</button>
                                <button onclick="execCmd('insertUnorderedList')" class="toolbar-btn" title="Bullet List"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/></svg></button>
                                <button onclick="insertLink()" class="toolbar-btn" title="Insert Link"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg></button>
                            </div>
                            <div id="eventDescription" contenteditable="true" class="editor-content w-full bg-slate-50 rounded-xl p-4 text-slate-700 border border-slate-200 focus:outline-none focus:border-orange-300">
                                <h1>Join us for an unforgettable evening!</h1>
                                <p>We're bringing together top innovators and creators for a night of networking, learning, and celebration.</p>
                                <h2>What to expect:</h2>
                                <ul>
                                    <li>Inspiring talks from industry leaders</li>
                                    <li>Delicious food and beverages</li>
                                    <li>Great company and networking opportunities</li>
                                </ul>
                                <p>Don't miss out on this opportunity to connect!</p>
                            </div>
                        </div>
                        
                        <div class="glass-card rounded-3xl p-6 shadow-herenow">
                            <div class="flex justify-between items-center mb-4">
                                <h2 class="text-2xl font-bold text-slate-900 font-brand">Moments Gallery</h2>
                                <button onclick="openModal('photoModal')" class="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                                    Upload
                                </button>
                            </div>
                            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4" id="gallery-grid"></div>
                        </div>
                    </section>
                    
                    <aside class="lg:col-span-1">
                        <div class="glass-card rounded-3xl p-6 h-full flex flex-col">
                            <div class="flex justify-between items-center mb-6">
                                <h2 class="text-2xl font-bold text-slate-900 font-brand">Resources</h2>
                                <button class="p-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition" onclick="openModal('resourceModal')">
                                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                                </button>
                            </div>
                            <div class="space-y-4 flex-grow" id="resources-list"></div>
                            <div onclick="openModal('resourceModal')" class="mt-6 p-4 border border-dashed border-slate-300 rounded-2xl text-center text-slate-400 text-sm hover:bg-slate-50 transition cursor-pointer">
                                <p>Drop files here to upload</p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            <!-- TAB 4: PLANNING -->
            <div id="view-planning" class="tab-view hidden">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <section class="lg:col-span-1 space-y-6">
                        <div class="glass-card rounded-3xl p-6 shadow-herenow h-full">
                            <div class="flex items-center gap-3 mb-6">
                                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white shadow-lg">
                                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
                                </div>
                                <div>
                                    <h2 class="text-xl font-bold text-slate-900 font-brand">AI Planner</h2>
                                    <p class="text-xs text-slate-500">Design extraordinary experiences</p>
                                </div>
                            </div>
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-bold text-slate-700 mb-1">Event Type</label>
                                    <input type="text" id="planType" class="form-input w-full rounded-xl px-3 py-2 text-sm" placeholder="e.g. Networking Mixer">
                                </div>
                                <div>
                                    <label class="block text-sm font-bold text-slate-700 mb-1">Target Audience</label>
                                    <input type="text" id="planAudience" class="form-input w-full rounded-xl px-3 py-2 text-sm" placeholder="e.g. Startup Founders">
                                </div>
                                <div>
                                    <label class="block text-sm font-bold text-slate-700 mb-1">Desired Vibe</label>
                                    <input type="text" id="planVibe" class="form-input w-full rounded-xl px-3 py-2 text-sm" placeholder="e.g. Chill, Inspiring">
                                </div>
                                <button onclick="generatePlan()" id="btnGeneratePlan" class="w-full py-3 mt-4 rounded-xl text-white font-bold shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2" style="background: linear-gradient(90deg, #FF6B3D 0%, #FF8E53 100%);">
                                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                    Brainstorm Experience
                                </button>
                            </div>
                        </div>
                    </section>

                    <section class="lg:col-span-2 space-y-6">
                        <div id="planEmpty" class="glass-card rounded-3xl p-10 flex flex-col items-center justify-center text-center h-full min-h-[400px] border-dashed border-2 border-slate-200">
                            <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <svg class="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                            </div>
                            <h3 class="text-xl font-bold text-slate-900 mb-2">Ready to innovate?</h3>
                            <p class="text-slate-500 max-w-md">Fill in the details on the left, and our AI will craft a unique event concept, agenda, and engagement strategy for you.</p>
                        </div>

                        <div id="planResults" class="hidden space-y-6">
                            <div class="glass-card rounded-3xl p-6 border-l-4 border-purple-500 group relative hover:shadow-lg transition">
                                <div class="flex justify-between items-start mb-3">
                                    <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <span class="bg-purple-100 text-purple-600 p-1.5 rounded-lg"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/></svg></span>
                                        Theme Concept
                                    </h3>
                                    <button onclick="copyToClipboard('resultThemeContainer')" class="text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition p-1 bg-white rounded-lg shadow-sm border border-slate-100" title="Copy Content">
                                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                                    </button>
                                </div>
                                <div id="resultThemeContainer">
                                    <h4 contenteditable="true" class="text-2xl font-extrabold text-slate-800 mb-2 outline-none hover:bg-white/50 rounded p-1 -ml-1 transition focus:bg-white focus:ring-2 focus:ring-purple-200" id="resultTheme">The Founder's Hearth</h4>
                                    <p contenteditable="true" class="text-slate-600 outline-none hover:bg-white/50 rounded p-1 -ml-1 transition focus:bg-white focus:ring-2 focus:ring-purple-200" id="resultDesc">An intimate, fireside-chat style gathering designed to strip away the corporate facade. Think warm lighting, comfortable seating, and 'unplugged' conversations about the real journey of building.</p>
                                </div>
                            </div>

                            <div class="glass-card rounded-3xl p-6 border-l-4 border-blue-500 group relative hover:shadow-lg transition">
                                <div class="flex justify-between items-start mb-4">
                                    <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <span class="bg-blue-100 text-blue-600 p-1.5 rounded-lg"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></span>
                                        Smart Agenda
                                    </h3>
                                    <button onclick="copyToClipboard('resultAgenda')" class="text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition p-1 bg-white rounded-lg shadow-sm border border-slate-100" title="Copy Content">
                                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                                    </button>
                                </div>
                                <div class="space-y-4 outline-none hover:bg-white/50 rounded p-1 -ml-1 transition focus:bg-white focus:ring-2 focus:ring-blue-200" contenteditable="true" id="resultAgenda">
                                </div>
                            </div>

                            <div class="glass-card rounded-3xl p-6 border-l-4 border-orange-500 group relative hover:shadow-lg transition">
                                <div class="flex justify-between items-start mb-3">
                                    <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <span class="bg-orange-100 text-orange-600 p-1.5 rounded-lg"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg></span>
                                        Wow Factor
                                    </h3>
                                    <button onclick="copyToClipboard('resultWow')" class="text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition p-1 bg-white rounded-lg shadow-sm border border-slate-100" title="Copy Content">
                                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                                    </button>
                                </div>
                                <p contenteditable="true" class="text-slate-600 outline-none hover:bg-white/50 rounded p-1 -ml-1 transition focus:bg-white focus:ring-2 focus:ring-orange-200" id="resultWow"><strong>"Future Self" Postcards:</strong> Have guests write a postcard to their future selves about one goal they want to achieve. You mail it to them in 6 months. A powerful, memorable touchpoint.</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <!-- TAB 5: INSIGHTS (New Feature) -->
            <div id="view-insights" class="tab-view hidden">
                <div class="space-y-8">
                    <!-- Header with Time Filter -->
                    <div class="flex flex-col md:flex-row justify-between items-center gap-4">
                        <h2 class="text-2xl font-bold text-slate-900 font-brand">Performance</h2>
                        <div class="bg-white p-1 rounded-xl border border-slate-200 flex shadow-sm">
                            <button onclick="updateInsights('today')" id="filter-today" class="insight-filter active-filter px-4 py-1.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 transition">Today</button>
                            <button onclick="updateInsights('7d')" id="filter-7d" class="insight-filter px-4 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 transition">7D</button>
                            <button onclick="updateInsights('28d')" id="filter-28d" class="insight-filter px-4 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 transition">28D</button>
                            <button onclick="updateInsights('1y')" id="filter-1y" class="insight-filter px-4 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 transition">1Y</button>
                            <button onclick="updateInsights('all')" id="filter-all" class="insight-filter px-4 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 transition">All</button>
                        </div>
                    </div>

                    <!-- Metrics Grid -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div class="glass-card p-6 rounded-2xl flex flex-col">
                            <span class="text-slate-500 text-sm font-medium mb-2">Page Views</span>
                            <div class="text-3xl font-extrabold text-slate-900" id="stat-views">1,240</div>
                            <div class="text-xs font-medium text-green-600 mt-2 flex items-center gap-1">
                                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg> +12%
                            </div>
                        </div>
                        <div class="glass-card p-6 rounded-2xl flex flex-col">
                            <span class="text-slate-500 text-sm font-medium mb-2">Shares</span>
                            <div class="text-3xl font-extrabold text-slate-900" id="stat-shares">85</div>
                            <div class="text-xs font-medium text-green-600 mt-2 flex items-center gap-1">
                                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg> +5%
                            </div>
                        </div>
                        <div class="glass-card p-6 rounded-2xl flex flex-col">
                            <span class="text-slate-500 text-sm font-medium mb-2">Registrations</span>
                            <div class="text-3xl font-extrabold text-slate-900" id="stat-registrations">128</div>
                            <div class="text-xs font-medium text-green-600 mt-2 flex items-center gap-1">
                                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg> +8%
                            </div>
                        </div>
                        <div class="glass-card p-6 rounded-2xl flex flex-col">
                            <span class="text-slate-500 text-sm font-medium mb-2">Total Revenue</span>
                            <div class="text-3xl font-extrabold text-slate-900" id="stat-revenue">$12,800</div>
                            <div class="text-xs font-medium text-green-600 mt-2 flex items-center gap-1">
                                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg> +15%
                            </div>
                        </div>
                    </div>

                    <!-- Chart Section -->
                    <div class="glass-card p-6 rounded-3xl">
                        <h3 class="text-lg font-bold text-slate-900 mb-6">Traffic Trend</h3>
                        <div class="h-48 flex items-end justify-between gap-2 px-2" id="insights-chart">
                            <!-- JS populated bars -->
                        </div>
                    </div>

                    <!-- Feedback Section -->
                    <div class="glass-card p-6 rounded-3xl">
                        <h3 class="text-lg font-bold text-slate-900 mb-4">Attendee Feedback</h3>
                        <div class="space-y-4" id="feedback-list">
                            <!-- JS populated list -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- OTHER TABS -->
            <!-- Removed More Placeholder -->
        </main>
        
        <!-- Toast -->
        <div id="toast" class="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl opacity-0 pointer-events-none transition-opacity duration-300 z-50">Action Successful</div>

        <!-- MODALS -->
        <div id="aiModal" class="modal hidden-modal fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onclick="closeModal('aiModal')">
            <div class="modal-content bg-white rounded-3xl shadow-2xl w-full max-w-md p-6" onclick="event.stopPropagation()">
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-2">
                        <div class="p-2 rounded-full bg-orange-100 text-orange-600">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        </div>
                        <h3 class="text-xl font-bold text-slate-900">AI Magic Assistant</h3>
                    </div>
                    <button onclick="closeModal('aiModal')" class="text-slate-400 hover:text-slate-600"><svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
                <div class="space-y-4">
                    <p class="text-sm text-slate-600">Describe the vibe, key details, and audience of your event. I'll write the copy for you!</p>
                    <textarea id="aiPrompt" class="w-full h-24 bg-slate-50 rounded-xl p-3 text-sm text-slate-700 border border-slate-200 focus:outline-none focus:border-orange-300 resize-none" placeholder="e.g. A tech networking night in New York for startup founders..."></textarea>
                    <div id="aiResult" class="hidden p-3 bg-orange-50 rounded-xl border border-orange-100 text-sm text-slate-700"></div>
                    <button onclick="generateAICopy()" id="aiGenerateBtn" class="w-full py-2.5 rounded-xl text-white font-bold shadow-md hover:opacity-90 transition" style="background-color: var(--color-herenow-orange);">Generate Copy</button>
                    <button onclick="useAICopy()" id="aiUseBtn" class="hidden w-full py-2.5 border-2 border-orange-500 text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition">Use This Draft</button>
                </div>
            </div>
        </div>

        <div id="photoModal" class="modal hidden-modal fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onclick="closeModal('photoModal')">
            <div class="modal-content bg-white rounded-3xl shadow-2xl w-full max-w-md p-6" onclick="event.stopPropagation()">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-slate-900">Add Photos</h3>
                    <button onclick="closeModal('photoModal')" class="text-slate-400 hover:text-slate-600"><svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
                <div class="flex border-b border-slate-200 mb-4">
                    <button onclick="switchPhotoTab('file')" id="tab-photo-file" class="w-1/2 pb-2 text-sm font-semibold text-orange-600 border-b-2 border-orange-600 transition">Upload File</button>
                    <button onclick="switchPhotoTab('url')" id="tab-photo-url" class="w-1/2 pb-2 text-sm font-medium text-slate-500 border-b-2 border-transparent hover:text-slate-700 transition">Image URL</button>
                </div>
                <div id="photo-file-input" class="block">
                    <div class="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 cursor-pointer">
                        <p class="text-sm text-slate-500">Click to browse files</p>
                    </div>
                </div>
                <div id="photo-url-input" class="hidden">
                    <input type="text" class="form-input w-full rounded-xl p-3 text-sm" placeholder="https://example.com/image.jpg">
                </div>
                <div class="mt-6 flex justify-end gap-3">
                    <button onclick="closeModal('photoModal')" class="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700">Cancel</button>
                    <button onclick="handlePhotoUpload()" class="px-6 py-2 text-sm font-bold text-white rounded-xl shadow-md hover:opacity-90 transition" style="background-color: var(--color-herenow-orange);">Add to Gallery</button>
                </div>
            </div>
        </div>

        <div id="resourceModal" class="modal hidden-modal fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onclick="closeModal('resourceModal')">
            <div class="modal-content bg-white rounded-3xl shadow-2xl w-full max-w-md p-6" onclick="event.stopPropagation()">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-slate-900">Upload Resource</h3>
                    <button onclick="closeModal('resourceModal')" class="text-slate-400 hover:text-slate-600"><svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
                <div class="space-y-4">
                    <div class="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 relative">
                        <input type="file" id="resourceFileInput" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onchange="checkFileSize(this)">
                        <p id="fileNameDisplay" class="text-sm text-slate-500">Drag file here or click to upload</p>
                        <p class="text-xs text-slate-400 mt-1">Max size: 20MB</p>
                    </div>
                    <p id="fileError" class="text-xs text-red-500 hidden text-center font-medium">File too large! Please choose a file under 20MB.</p>
                    <label class="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                        <input type="checkbox" class="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 border-gray-300">
                        <span class="text-sm font-medium text-slate-700">Require Registration to Download</span>
                    </label>
                </div>
                <div class="mt-6 flex justify-end gap-3">
                    <button onclick="closeModal('resourceModal')" class="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700">Cancel</button>
                    <button onclick="handleResourceUpload()" class="px-6 py-2 text-sm font-bold text-white rounded-xl shadow-md hover:opacity-90 transition" style="background-color: var(--color-herenow-orange);">Upload</button>
                </div>
            </div>
        </div>

    </div>

    <script>
        // --- DATA ---
        const guests = [
            { name: 'Alex Johnson', email: 'alex.j@example.com', date: 'Nov 20, 10:30 AM', amt: 50, checkedIn: true, ticket: 'VIP' },
            { name: 'Bianca Lee', email: 'bianca.l@example.com', date: 'Nov 20, 11:45 AM', amt: 0, checkedIn: false, ticket: 'General' },
            { name: 'Chris Miller', email: 'chris.m@example.com', date: 'Nov 20, 1:05 PM', amt: 25, checkedIn: true, ticket: 'Early Bird' },
            { name: 'Dana Evans', email: 'dana.e@example.com', date: 'Nov 21, 9:00 AM', amt: 75, checkedIn: false, ticket: 'VIP' },
            { name: 'Ethan Fox', email: 'ethan.f@example.com', date: 'Nov 21, 2:20 PM', amt: 0, checkedIn: false, ticket: 'General' },
            { name: 'Fiona Gray', email: 'fiona.g@example.com', date: 'Nov 22, 8:40 AM', amt: 100, checkedIn: true, ticket: 'VIP' },
            { name: 'George Hall', email: 'george.h@example.com', date: 'Nov 22, 3:55 PM', amt: 0, checkedIn: false, ticket: 'General' },
        ];

        const galleryPhotos = [
            { id: 1, color: 'bg-blue-200', likes: 24, liked: true },
            { id: 2, color: 'bg-purple-200', likes: 12, liked: false },
            { id: 3, color: 'bg-green-200', likes: 5, liked: false },
            { id: 4, color: 'bg-orange-200', likes: 38, liked: true },
            { id: 5, color: 'bg-pink-200', likes: 0, liked: false },
        ];

        const resources = [
            { id: 1, name: 'Event_Schedule.pdf', size: '2.4 MB', regRequired: false },
            { id: 2, name: 'Speaker_Bios.pdf', size: '1.1 MB', regRequired: true },
            { id: 3, name: 'Workshop_Materials.zip', size: '15 MB', regRequired: true },
        ];

        // --- INSIGHTS DATA ---
        const insightsData = {
            'today': { views: 1240, shares: 85, regs: 128, rev: 12800, bars: [40, 60, 30, 80, 50, 90, 100] },
            '7d': { views: 8500, shares: 420, regs: 950, rev: 85000, bars: [60, 80, 50, 90, 70, 100, 80] },
            '28d': { views: 32000, shares: 1500, regs: 3800, rev: 320000, bars: [50, 70, 90, 60, 80, 70, 90] },
            '1y': { views: 150000, shares: 6000, regs: 18000, rev: 1500000, bars: [80, 60, 70, 90, 80, 90, 100] },
            'all': { views: 180000, shares: 7200, regs: 21000, rev: 1800000, bars: [70, 80, 90, 80, 90, 100, 90] }
        };

        const feedbacks = [
            { name: 'Alice M.', avatar: 'AM', time: '2h ago', content: 'Loved the session on AI! Very insightful.' },
            { name: 'Bob D.', avatar: 'BD', time: '5h ago', content: 'Great venue, but parking was a bit tricky.' },
            { name: 'Charlie K.', avatar: 'CK', time: '1d ago', content: 'Will there be a recording available? I missed the intro.' }
        ];

        // --- LOGIC ---
        function switchTab(tabName) {
            const titles = { overview: 'Overview', guests: 'Guests', content: 'Content', planning: 'Planning', insights: 'Insights' };
            const currentTabNameEl = document.getElementById('currentTabName');
            if (currentTabNameEl) currentTabNameEl.textContent = titles[tabName] || 'Overview';

            document.querySelectorAll('.tab-view').forEach(el => el.classList.add('hidden'));
            const viewEl = document.getElementById('view-' + tabName);
            if (viewEl) viewEl.classList.remove('hidden');

            document.querySelectorAll('button[id^="btn-"]').forEach(btn => {
                btn.className = 'tab-inactive pb-3 text-lg transition-colors';
            });
            const activeBtn = document.getElementById('btn-' + tabName);
            if(activeBtn) activeBtn.className = 'tab-active pb-3 text-lg transition-colors';

            if(tabName === 'guests') {
                filterGuests();
            } else if (tabName === 'content') {
                renderGallery();
                renderResources();
            } else if (tabName === 'insights') {
                updateInsights('today');
                renderFeedback();
            }
        }

        // --- RICH TEXT EDITOR LOGIC ---
        function execCmd(command, value = null) {
            document.execCommand(command, false, value);
            document.getElementById('eventDescription').focus();
        }
        function insertLink() {
            const url = prompt('Enter link URL:', 'https://');
            if (url) execCmd('createLink', url);
        }

        // --- GUESTS LOGIC ---
        function getAvatarColor(initials) {
            const hash = initials.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const colors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-orange-100', 'bg-red-100'];
            const textColors = ['text-blue-700', 'text-green-700', 'text-purple-700', 'text-orange-700', 'text-red-700'];
            const index = hash % colors.length;
            return { bg: colors[index], text: textColors[index] };
        }

        function renderGuests(dataToRender) {
            const tbody = document.getElementById('guests-body');
            const emptyState = document.getElementById('emptyState');
            const countDisplay = document.getElementById('guestCountDisplay');
            
            if(!tbody) return;

            if (!dataToRender) dataToRender = guests;

            countDisplay.textContent = dataToRender.length;

            if (dataToRender.length === 0) {
                tbody.innerHTML = '';
                emptyState.classList.remove('hidden');
                return;
            }
            emptyState.classList.add('hidden');

            tbody.innerHTML = dataToRender.map(g => {
                const initials = g.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                const { bg, text } = getAvatarColor(initials);
                
                const checkInStatus = g.checkedIn 
                    ? '<span class="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Checked In</span>'
                    : '<span class="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">Pending</span>';

                let ticketBadgeClass = 'bg-slate-100 text-slate-600';
                if(g.ticket === 'VIP') ticketBadgeClass = 'bg-purple-100 text-purple-700';
                if(g.ticket === 'Early Bird') ticketBadgeClass = 'bg-blue-100 text-blue-700';

                return `
                <tr class="hover:bg-slate-50/50 transition">
                    <td class="py-3 pl-4 pr-3">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${bg} ${text} flex-shrink-0">${initials}</div>
                            <div class="font-bold text-slate-900">${g.name}</div>
                        </div>
                    </td>
                    <td>${g.email}</td>
                    <td><span class="px-2 py-1 rounded-full text-xs font-semibold ${ticketBadgeClass}">${g.ticket}</span></td>
                    <td>${g.date}</td>
                    <td class="font-mono">$${g.amt}</td>
                    <td>${checkInStatus}</td>
                </tr>
            `}).join('');
        }

        function filterGuests() {
            const searchInput = document.getElementById('searchInput');
            const ticketFilter = document.getElementById('ticketFilter');
            const statusFilter = document.getElementById('statusFilter');

            if(!searchInput) return;

            const searchText = searchInput.value.toLowerCase();
            const ticketVal = ticketFilter.value;
            const statusVal = statusFilter.value;

            const filtered = guests.filter(g => {
                const matchesSearch = g.name.toLowerCase().includes(searchText) || g.email.toLowerCase().includes(searchText);
                const matchesTicket = ticketVal === 'all' || g.ticket === ticketVal;
                let matchesStatus = true;
                if (statusVal === 'checkedIn') matchesStatus = g.checkedIn;
                if (statusVal === 'pending') matchesStatus = !g.checkedIn;
                return matchesSearch && matchesTicket && matchesStatus;
            });
            renderGuests(filtered);
        }

        // --- CONTENT TAB LOGIC ---
        function renderGallery() {
            const container = document.getElementById('gallery-grid');
            if(!container) return;
            container.innerHTML = galleryPhotos.map(photo => `
                <div class="relative aspect-square rounded-xl ${photo.color} group overflow-hidden cursor-pointer hover:shadow-md transition">
                    <div class="absolute top-2 right-2 bg-black/20 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition">Photo #${photo.id}</div>
                    <div class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent flex justify-end items-end">
                        <button class="flex items-center space-x-1 text-white hover:scale-110 transition" onclick="toggleLike(${photo.id})">
                            <svg class="w-5 h-5 ${photo.liked ? 'text-red-500 fill-current' : 'text-white'}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="${photo.liked ? '0' : '2'}">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span class="text-xs font-bold">${photo.likes}</span>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        function toggleLike(id) {
            const photo = galleryPhotos.find(p => p.id === id);
            if (photo) {
                photo.liked = !photo.liked;
                photo.likes += photo.liked ? 1 : -1;
                renderGallery(); 
            }
        }

        function renderResources() {
            const container = document.getElementById('resources-list');
            if(!container) return;
            container.innerHTML = resources.map(res => `
                <div class="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 hover:border-orange-200 transition group">
                    <div class="flex items-center gap-3 overflow-hidden">
                        <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        </div>
                        <div class="min-w-0">
                            <p class="text-sm font-bold text-slate-900 truncate">${res.name}</p>
                            <p class="text-xs text-slate-500">${res.size}</p>
                        </div>
                    </div>
                    <div class="flex flex-col items-end gap-1">
                        ${res.regRequired ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 flex-shrink-0">Reg. Req</span>' : '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 flex-shrink-0">Public</span>'}
                        <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                            <button class="text-slate-400 hover:text-slate-700" title="Download"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg></button>
                            <button class="text-slate-400 hover:text-red-500" title="Delete"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // --- PLANNING LOGIC (AI PLANNER) ---
        function generatePlan() {
            const btn = document.getElementById('btnGeneratePlan');
            const originalText = btn.innerHTML;
            
            btn.disabled = true;
            btn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Dreaming up ideas...`;

            // Simulate AI delay
            setTimeout(() => {
                document.getElementById('planEmpty').classList.add('hidden');
                const results = document.getElementById('planResults');
                results.classList.remove('hidden');
                results.classList.add('animate-fade-in-up'); // Add simple fade in logic if CSS supports or just show

                // Populate simple dummy data
                document.getElementById('resultAgenda').innerHTML = `
                    <div class="flex gap-4 relative pb-6 border-l-2 border-slate-200 pl-6 last:border-0 last:pb-0">
                        <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300 border-4 border-white"></div>
                        <div><span class="font-bold text-slate-900">6:00 PM</span> <span class="text-slate-600">Arrival & "Unplugged" Cocktails</span></div>
                    </div>
                    <div class="flex gap-4 relative pb-6 border-l-2 border-slate-200 pl-6 last:border-0 last:pb-0">
                        <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300 border-4 border-white"></div>
                        <div><span class="font-bold text-slate-900">6:45 PM</span> <span class="text-slate-600">Fireside Chat: "The Real Struggle"</span></div>
                    </div>
                    <div class="flex gap-4 relative pb-6 border-l-2 border-slate-200 pl-6 last:border-0 last:pb-0">
                        <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300 border-4 border-white"></div>
                        <div><span class="font-bold text-slate-900">7:30 PM</span> <span class="text-slate-600">Networking Roulette</span></div>
                    </div>
                `;

                btn.innerHTML = originalText;
                btn.disabled = false;
                showToast('Experience Plan Generated!');
            }, 2000);
        }

        function copyToClipboard(elementId) {
            const element = document.getElementById(elementId);
            if (element) {
                const text = element.innerText;
                navigator.clipboard.writeText(text).then(() => {
                    showToast('Content Copied!');
                }).catch(err => {
                    console.error('Failed to copy: ', err);
                });
            }
        }

        // --- INSIGHTS LOGIC ---
        function updateInsights(range) {
            // Update Filters UI
            document.querySelectorAll('.insight-filter').forEach(btn => {
                btn.classList.remove('active-filter', 'font-semibold', 'text-slate-600');
                btn.classList.add('text-slate-500', 'font-medium');
            });
            document.getElementById(`filter-${range}`).classList.add('active-filter', 'font-semibold', 'text-slate-600');
            document.getElementById(`filter-${range}`).classList.remove('text-slate-500', 'font-medium');

            // Update Stats
            const data = insightsData[range];
            document.getElementById('stat-views').innerText = data.views.toLocaleString();
            document.getElementById('stat-shares').innerText = data.shares.toLocaleString();
            document.getElementById('stat-registrations').innerText = data.regs.toLocaleString();
            document.getElementById('stat-revenue').innerText = '$' + data.rev.toLocaleString();

            // Update Chart
            const chart = document.getElementById('insights-chart');
            chart.innerHTML = data.bars.map(h => `
                <div class="w-full bg-orange-100 rounded-t-md relative group" style="height: ${h}%">
                    <div class="absolute bottom-0 w-full bg-herenow-orange rounded-t-md transition-all duration-500" style="height: 0%" onload="this.style.height='${h}%'"></div>
                    <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">${h}</div>
                </div>
            `).join('');
            
            // Trigger simple animation for bars
            setTimeout(() => {
                const bars = chart.querySelectorAll('.bg-herenow-orange');
                bars.forEach((bar, i) => {
                    bar.style.height = '100%'; 
                });
            }, 50);
        }

        function renderFeedback() {
            const list = document.getElementById('feedback-list');
            list.innerHTML = feedbacks.map(f => {
                const { bg, text } = getAvatarColor(f.avatar);
                return `
                <div class="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${bg} ${text} flex-shrink-0">${f.avatar}</div>
                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <h4 class="font-bold text-slate-900 text-sm">${f.name}</h4>
                            <span class="text-xs text-slate-400">${f.time}</span>
                        </div>
                        <p class="text-sm text-slate-600">${f.content}</p>
                    </div>
                </div>
            `}).join('');
        }

        // --- MODAL & HELPER FUNCTIONS ---
        function openModal(id) {
            document.getElementById(id).classList.remove('hidden-modal');
            document.getElementById(id).classList.add('visible-modal');
        }
        function closeModal(id) {
            document.getElementById(id).classList.remove('visible-modal');
            document.getElementById(id).classList.add('hidden-modal');
        }
        function generateAICopy() { 
            const prompt = document.getElementById('aiPrompt').value;
            if(!prompt) return;
            
            const btn = document.getElementById('aiGenerateBtn');
            const originalText = btn.innerText;
            btn.innerText = 'Generating...';
            btn.disabled = true;

            setTimeout(() => {
                const draft = `
                    <h1>Join us for an unforgettable evening!</h1>
                    <p>We're bringing together top innovators and creators for a night of networking, learning, and celebration.</p>
                    <h2>What to expect:</h2>
                    <ul>
                        <li>Inspiring talks from industry leaders</li>
                        <li>Delicious food and beverages</li>
                        <li>Great company and networking opportunities</li>
                    </ul>
                    <p>Don't miss out on this opportunity to connect!</p>
                `;
                const resultDiv = document.getElementById('aiResult');
                resultDiv.innerHTML = draft; 
                resultDiv.classList.remove('hidden');
                document.getElementById('aiUseBtn').classList.remove('hidden');
                btn.innerText = originalText;
                btn.disabled = false;
            }, 1500);
        }
        function useAICopy() {
            const htmlContent = document.getElementById('aiResult').innerHTML;
            document.getElementById('eventDescription').innerHTML = htmlContent; 
            closeModal('aiModal');
            showToast('AI Content Applied!');
        }
        function handlePhotoUpload() { closeModal('photoModal'); showToast('Photo Added!'); }
        function switchPhotoTab(type) {
            if (type === 'file') {
                document.getElementById('photo-file-input').classList.remove('hidden');
                document.getElementById('photo-url-input').classList.add('hidden');
                document.getElementById('tab-photo-file').classList.replace('text-slate-500', 'text-orange-600');
                document.getElementById('tab-photo-file').classList.replace('border-transparent', 'border-orange-600');
                document.getElementById('tab-photo-url').classList.replace('text-orange-600', 'text-slate-500');
                document.getElementById('tab-photo-url').classList.replace('border-orange-600', 'border-transparent');
            } else {
                document.getElementById('photo-file-input').classList.add('hidden');
                document.getElementById('photo-url-input').classList.remove('hidden');
                document.getElementById('tab-photo-url').classList.replace('text-slate-500', 'text-orange-600');
                document.getElementById('tab-photo-url').classList.replace('border-transparent', 'border-orange-600');
                document.getElementById('tab-photo-file').classList.replace('text-orange-600', 'text-slate-500');
                document.getElementById('tab-photo-file').classList.replace('border-orange-600', 'border-transparent');
            }
        }
        function checkFileSize(input) {
            const file = input.files[0];
            if (file && file.size > 20 * 1024 * 1024) { 
                document.getElementById('fileError').classList.remove('hidden');
                input.value = ''; 
                document.getElementById('fileNameDisplay').innerText = "Drag file here or click to upload";
            } else if (file) {
                document.getElementById('fileError').classList.add('hidden');
                document.getElementById('fileNameDisplay').innerText = file.name;
            }
        }
        function handleResourceUpload() { closeModal('resourceModal'); showToast('Resource Uploaded!'); }
        function copyLink(btn) { navigator.clipboard.writeText('herenow.events/e/et9wrmvr'); showToast('Link Copied!'); }
        function exportCsv() { showToast('Exporting CSV...'); }
        function showToast(msg) {
            const t = document.getElementById('toast');
            t.textContent = msg;
            t.classList.remove('opacity-0');
            setTimeout(() => t.classList.add('opacity-0'), 2000);
        }
        function pauseEvent() { if(confirm("Are you sure you want to pause registrations? No new guests will be able to sign up.")) { showToast("Registrations Paused"); } }
        function cancelEvent() { if(confirm("Are you sure you want to cancel this event? This action cannot be undone.")) { showToast("Event Cancelled"); } }

        // Init
        window.onload = () => {
             switchTab('overview');
        };
    </script>
</body>
</html>