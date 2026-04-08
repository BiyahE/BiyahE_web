/**
 * ============================================
 * MAP MODULE - NEUMORPHIC OPTIMIZED
 * Modern Bus Management System
 * ============================================
 */

// Map configuration
const MAP_CONFIG = {
    center: [9.605, 123.82],
    zoom: 12,
    minZoom: 11,
    maxZoom: 17
};

// Specific locations
const LOCATIONS = {
    daoTerminal: {
        name: 'Dao Integrated Bus Terminal',
        coords: [9.6705, 123.8695],
        type: 'terminal',
        description: 'Main bus terminal in Tagbilaran City',
        address: 'MV4C+MHF, Tagbilaran City, Bohol'
    },
    panglaoAirport: {
        name: 'Panglao International Airport',
        coords: [9.5742, 123.7956],
        type: 'airport',
        description: 'Bohol-Panglao International Airport',
        code: 'TAG'
    },
    dauisBridge: {
        name: 'Dauis Bridge (Causeway)',
        coords: [9.6255, 123.8650],
        type: 'landmark',
        description: 'Bridge connecting Tagbilaran to Panglao Island'
    }
};

// Bus stops along the route
const BUS_STOPS = [
    {
        id: 'BUS-001',
        coords: [9.6650, 123.8670],
        route: 'Dao Terminal → Panglao Airport',
        driver: 'Juan Dela Cruz',
        status: 'active',
        location: 'Near Island City Mall',
        nextStop: 'Dauis Bridge',
        eta: '15 mins',
        type: 'city_bus'
    },
    {
        id: 'BUS-002',
        coords: [9.6380, 123.8620],
        route: 'Dao Terminal → Panglao Airport',
        driver: 'Maria Santos',
        status: 'active',
        location: 'Dauis Bridge Approach',
        nextStop: 'Dauis Town Proper',
        eta: '10 mins',
        type: 'airport_shuttle'
    },
    {
        id: 'BUS-003',
        coords: [9.6100, 123.8500],
        route: 'Dauis → Panglao Airport',
        driver: 'Pedro Reyes',
        status: 'active',
        location: 'Dauis-Panglao Road',
        nextStop: 'Panglao International Airport',
        eta: '12 mins',
        type: 'airport_shuttle'
    },
    {
        id: 'BUS-004',
        coords: [9.5850, 123.8100],
        route: 'Tagbilaran → Panglao (Direct)',
        driver: 'Ana Lim',
        status: 'inactive',
        location: 'Tawala Area',
        nextStop: 'Alona Beach Junction',
        eta: '—',
        type: 'tourist_bus'
    },
    {
        id: 'BUS-005',
        coords: [9.5760, 123.7980],
        route: 'Airport Shuttle',
        driver: 'Roberto Cruz',
        status: 'active',
        location: 'Near Panglao Airport',
        nextStop: 'Panglao International Airport',
        eta: '2 mins',
        type: 'airport_shuttle'
    }
];

/**
 * Initialize Dashboard Map
 */
function initDashboardMap() {
    const container = document.getElementById('dashboardMap');
    if (!container) return;

    if (dashboardMap) {
        dashboardMap.remove();
        dashboardMap = null;
    }

    dashboardMap = L.map('dashboardMap', {
        center: MAP_CONFIG.center,
        zoom: MAP_CONFIG.zoom,
        minZoom: MAP_CONFIG.minZoom,
        maxZoom: MAP_CONFIG.maxZoom,
        zoomControl: false,
        attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(dashboardMap);

    L.control.zoom({ position: 'bottomright' }).addTo(dashboardMap);

    addLocationMarkers(dashboardMap);
    addStaticBusPins(dashboardMap);
}

/**
 * Initialize Live Tracking Map
 */
function initTrackingMap() {
    const container = document.getElementById('trackingMap');
    if (!container) return;

    if (trackingMap) {
        trackingMap.remove();
        trackingMap = null;
    }

    trackingMap = L.map('trackingMap', {
        center: MAP_CONFIG.center,
        zoom: 13,
        minZoom: 11,
        maxZoom: 18,
        scrollWheelZoom: true,
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(trackingMap);

    addLocationMarkers(trackingMap);
    addStaticBusPins(trackingMap);
    
    setupFullscreen();
}

/**
 * Add location markers
 */
function addLocationMarkers(map) {
    // Terminal Icon - Neumorphic
    const terminalIcon = L.divIcon({
        className: 'location-marker',
        html: `
            <div style="
                background: linear-gradient(145deg, #fde338, #e6cc32);
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 
                    4px 4px 8px rgba(0,0,0,0.4),
                    -2px -2px 6px rgba(255,255,255,0.1),
                    inset 1px 1px 2px rgba(255,255,255,0.3),
                    inset -1px -1px 2px rgba(0,0,0,0.2);
            ">
                <i class="fas fa-bus" style="color: #242552; font-size: 16px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));"></i>
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
    });

    // Airport Icon - Neumorphic
    const airportIcon = L.divIcon({
        className: 'location-marker',
        html: `
            <div style="
                background: linear-gradient(145deg, #60a5fa, #3b82f6);
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 
                    4px 4px 8px rgba(0,0,0,0.4),
                    -2px -2px 6px rgba(255,255,255,0.1),
                    inset 1px 1px 2px rgba(255,255,255,0.3),
                    inset -1px -1px 2px rgba(0,0,0,0.2);
            ">
                <i class="fas fa-plane" style="color: #fff; font-size: 16px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));"></i>
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
    });

    // Landmark Icon - Neumorphic
    const landmarkIcon = L.divIcon({
        className: 'location-marker',
        html: `
            <div style="
                background: linear-gradient(145deg, #34d399, #10b981);
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 
                    3px 3px 6px rgba(0,0,0,0.3),
                    -2px -2px 4px rgba(255,255,255,0.1),
                    inset 1px 1px 2px rgba(255,255,255,0.3),
                    inset -1px -1px 2px rgba(0,0,0,0.2);
            ">
                <i class="fas fa-bridge" style="color: #fff; font-size: 14px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));"></i>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });

    // Dao Terminal Marker
    L.marker(LOCATIONS.daoTerminal.coords, { icon: terminalIcon })
        .addTo(map)
        .bindPopup(`
            <div style="font-family: 'Segoe UI', sans-serif; padding: 4px; min-width: 160px;">
                <h3 style="margin: 0 0 4px 0; color: #fde338; font-size: 13px; font-weight: 700;">
                    <i class="fas fa-bus" style="margin-right: 4px;"></i>${LOCATIONS.daoTerminal.name}
                </h3>
                <p style="margin: 0 0 3px 0; color: #ccc; font-size: 11px; line-height: 1.3;">
                    ${LOCATIONS.daoTerminal.description}
                </p>
                <p style="margin: 0; color: #999; font-size: 10px;">
                    <i class="fas fa-map-marker-alt" style="color: #f87171; margin-right: 3px;"></i>${LOCATIONS.daoTerminal.address}
                </p>
            </div>
        `);

    // Panglao Airport Marker
    L.marker(LOCATIONS.panglaoAirport.coords, { icon: airportIcon })
        .addTo(map)
        .bindPopup(`
            <div style="font-family: 'Segoe UI', sans-serif; padding: 4px; min-width: 160px;">
                <h3 style="margin: 0 0 4px 0; color: #60a5fa; font-size: 13px; font-weight: 700;">
                    <i class="fas fa-plane" style="margin-right: 4px;"></i>${LOCATIONS.panglaoAirport.name}
                </h3>
                <p style="margin: 0 0 3px 0; color: #ccc; font-size: 11px; line-height: 1.3;">
                    ${LOCATIONS.panglaoAirport.description}
                </p>
                <p style="margin: 0; color: #999; font-size: 10px;">
                    <i class="fas fa-code" style="color: #fde338; margin-right: 3px;"></i>IATA: ${LOCATIONS.panglaoAirport.code}
                </p>
            </div>
        `);

    // Dauis Bridge Marker
    L.marker(LOCATIONS.dauisBridge.coords, { icon: landmarkIcon })
        .addTo(map)
        .bindPopup(`
            <div style="font-family: 'Segoe UI', sans-serif; padding: 4px; min-width: 140px;">
                <h3 style="margin: 0 0 4px 0; color: #34d399; font-size: 12px; font-weight: 700;">
                    <i class="fas fa-bridge" style="margin-right: 4px;"></i>${LOCATIONS.dauisBridge.name}
                </h3>
                <p style="margin: 0; color: #ccc; font-size: 11px; line-height: 1.3;">
                    ${LOCATIONS.dauisBridge.description}
                </p>
            </div>
        `);
}

/**
 * Add neumorphic bus pins
 */
function addStaticBusPins(map) {
    if (window.staticBusMarkers) {
        window.staticBusMarkers.forEach(marker => map.removeLayer(marker));
    }
    window.staticBusMarkers = [];

    BUS_STOPS.forEach((bus, index) => {
        const isActive = bus.status === 'active';
        const statusColor = isActive ? '#34d399' : '#f87171';
        const statusGlow = isActive ? 'rgba(52, 211, 153, 0.5)' : 'rgba(248, 113, 113, 0.5)';
        
        // Neumorphic 36x36 pin
        const busIcon = L.divIcon({
            className: 'neumorphic-bus-pin',
            html: `
                <div class="pin-wrapper" style="
                    position: relative;
                    width: 36px;
                    height: 36px;
                    cursor: pointer;
                ">
                    <!-- Outer base - neumorphic shadow -->
                    <div style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 34px;
                        height: 34px;
                        border-radius: 50%;
                        background: linear-gradient(145deg, #2a2b5e, #1e1f42);
                        box-shadow: 
                            4px 4px 8px #151631,
                            -4px -4px 8px #353779;
                        z-index: 1;
                    "></div>
                    
                    <!-- Inner concave - neumorphic inset -->
                    <div class="pin-inner" style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 28px;
                        height: 28px;
                        border-radius: 50%;
                        background: linear-gradient(145deg, #1e1f42, #2a2b5e);
                        box-shadow: 
                            inset 2px 2px 4px #151631,
                            inset -2px -2px 4px #353779;
                        z-index: 2;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s ease;
                    ">
                        <i class="fas fa-bus" style="
                            color: ${statusColor};
                            font-size: 12px;
                            filter: drop-shadow(0 0 4px ${statusGlow});
                            transition: all 0.2s ease;
                        "></i>
                    </div>
                    
                    <!-- Status dot - neumorphic -->
                    <div class="status-dot" style="
                        position: absolute;
                        bottom: 2px;
                        right: 2px;
                        width: 10px;
                        height: 10px;
                        border-radius: 50%;
                        background: linear-gradient(145deg, ${statusColor}, ${isActive ? '#059669' : '#dc2626'});
                        box-shadow: 
                            2px 2px 4px #151631,
                            -1px -1px 2px #353779,
                            inset 1px 1px 2px rgba(255,255,255,0.3);
                        z-index: 3;
                        animation: ${isActive ? 'pulse 2s infinite' : 'none'};
                        transition: transform 0.2s ease;
                    "></div>
                    
                    <!-- Ripple for active -->
                    ${isActive ? `
                    <div style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 34px;
                        height: 34px;
                        border-radius: 50%;
                        border: 2px solid ${statusColor};
                        opacity: 0.4;
                        animation: ripple 2s infinite;
                        z-index: 0;
                        pointer-events: none;
                    "></div>
                    ` : ''}
                </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -18]
        });

        const marker = L.marker(bus.coords, { 
            icon: busIcon,
            title: bus.id,
            riseOnHover: false,
            interactive: true
        }).addTo(map);

        // Hover effects
        const markerEl = marker.getElement();
        if (markerEl) {
            const inner = markerEl.querySelector('.pin-inner');
            const dot = markerEl.querySelector('.status-dot');
            const icon = inner?.querySelector('i');
            
            markerEl.addEventListener('mouseenter', function() {
                if (inner) {
                    inner.style.transform = 'translate(-50%, -50%) scale(1.15)';
                    inner.style.boxShadow = 'inset 3px 3px 6px #151631, inset -3px -3px 6px #353779';
                }
                if (icon) icon.style.transform = 'scale(1.1)';
                if (dot) dot.style.transform = 'scale(1.3)';
                marker.setZIndexOffset(1000);
            });
            
            markerEl.addEventListener('mouseleave', function() {
                if (inner) {
                    inner.style.transform = 'translate(-50%, -50%) scale(1)';
                    inner.style.boxShadow = 'inset 2px 2px 4px #151631, inset -2px -2px 4px #353779';
                }
                if (icon) icon.style.transform = 'scale(1)';
                if (dot) dot.style.transform = 'scale(1)';
                marker.setZIndexOffset(0);
            });
        }

        // Compact neumorphic popup content
        const popupContent = `
            <div style="width: 170px; font-family: 'Segoe UI', sans-serif;">
                <!-- Header - Neumorphic -->
                <div style="
                    background: linear-gradient(145deg, #2a2b5e, #1e1f42);
                    box-shadow: 
                        0 4px 8px rgba(0,0,0,0.3),
                        inset 0 1px 1px rgba(255,255,255,0.1);
                    padding: 8px;
                    margin: -8px -8px 8px -8px;
                    border-radius: 8px 8px 0 0;
                    border-bottom: 1px solid rgba(253, 227, 56, 0.3);
                ">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="
                            width: 28px;
                            height: 28px;
                            border-radius: 50%;
                            background: linear-gradient(145deg, #1e1f42, #2a2b5e);
                            box-shadow: 
                                2px 2px 4px #151631,
                                -2px -2px 4px #353779,
                                inset 1px 1px 2px rgba(255,255,255,0.1);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            flex-shrink: 0;
                        ">
                            <i class="fas fa-bus" style="color: ${statusColor}; font-size: 12px; filter: drop-shadow(0 0 4px ${statusGlow});"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0; color: #fff; font-size: 13px; font-weight: 800; letter-spacing: 1px;">${bus.id}</h3>
                            <span style="
                                display: inline-block;
                                padding: 1px 4px;
                                border-radius: 8px;
                                font-size: 8px;
                                font-weight: 700;
                                text-transform: uppercase;
                                background: linear-gradient(145deg, ${isActive ? '#1e1f42' : '#2a2b5e'}, ${isActive ? '#2a2b5e' : '#1e1f42'});
                                box-shadow: 
                                    1px 1px 2px #151631,
                                    -1px -1px 2px #353779,
                                    inset 1px 1px 2px rgba(255,255,255,0.1);
                                color: ${statusColor};
                                border: 1px solid ${statusColor};
                            ">${bus.status}</span>
                        </div>
                    </div>
                </div>

                <!-- Content - Neumorphic containers -->
                <div style="padding: 0 1px;">
                    <!-- Route -->
                    <div style="
                        background: linear-gradient(145deg, #1e1f42, #2a2b5e);
                        box-shadow: 
                            2px 2px 4px #151631,
                            -2px -2px 4px #353779,
                            inset 1px 1px 2px rgba(255,255,255,0.05);
                        border-radius: 6px;
                        padding: 6px;
                        margin-bottom: 6px;
                    ">
                        <p style="margin: 0 0 2px 0; color: #8b8db9; font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Route</p>
                        <p style="margin: 0; color: #fde338; font-size: 10px; font-weight: 600; line-height: 1.3;">${bus.route}</p>
                    </div>

                    <!-- Grid -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 6px;">
                        <div style="
                            background: linear-gradient(145deg, #1e1f42, #2a2b5e);
                            box-shadow: 
                                1px 1px 2px #151631,
                                -1px -1px 2px #353779,
                                inset 1px 1px 2px rgba(255,255,255,0.05);
                            border-radius: 4px;
                            padding: 6px;
                        ">
                            <p style="margin: 0 0 1px 0; color: #8b8db9; font-size: 7px; text-transform: uppercase;">Driver</p>
                            <p style="margin: 0; color: #fff; font-size: 9px; font-weight: 600;">
                                <i class="fas fa-user" style="color: #60a5fa; margin-right: 2px; font-size: 8px;"></i>${bus.driver}
                            </p>
                        </div>
                        <div style="
                            background: linear-gradient(145deg, #1e1f42, #2a2b5e);
                            box-shadow: 
                                1px 1px 2px #151631,
                                -1px -1px 2px #353779,
                                inset 1px 1px 2px rgba(255,255,255,0.05);
                            border-radius: 4px;
                            padding: 6px;
                        ">
                            <p style="margin: 0 0 1px 0; color: #8b8db9; font-size: 7px; text-transform: uppercase;">Location</p>
                            <p style="margin: 0; color: #fff; font-size: 9px; font-weight: 600;">
                                <i class="fas fa-map-pin" style="color: #f87171; margin-right: 2px; font-size: 8px;"></i>${bus.location}
                            </p>
                        </div>
                    </div>

                    <!-- Next Stop & ETA -->
                    <div style="
                        background: linear-gradient(145deg, #1e1f42, #2a2b5e);
                        box-shadow: 
                            2px 2px 4px #151631,
                            -2px -2px 4px #353779,
                            inset 1px 1px 2px rgba(255,255,255,0.05);
                        border-radius: 6px;
                        padding: 6px;
                        margin-bottom: 8px;
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <p style="margin: 0 0 1px 0; color: #8b8db9; font-size: 7px; text-transform: uppercase;">Next Stop</p>
                                <p style="margin: 0; color: #fde338; font-size: 10px; font-weight: 700;">
                                    <i class="fas fa-flag" style="margin-right: 2px; font-size: 8px;"></i>${bus.nextStop}
                                </p>
                            </div>
                            <div style="text-align: right;">
                                <p style="margin: 0 0 1px 0; color: #8b8db9; font-size: 7px; text-transform: uppercase;">ETA</p>
                                <p style="margin: 0; color: #60a5fa; font-size: 12px; font-weight: 800;">${bus.eta}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Status Display -->
                    ${isActive ? `
                    <div style="
                        width: 100%;
                        padding: 8px;
                        border-radius: 6px;
                        background: linear-gradient(145deg, #1e1f42, #2a2b5e);
                        box-shadow: 
                            inset 2px 2px 4px #151631,
                            inset -2px -2px 4px #353779;
                        color: #34d399;
                        font-size: 10px;
                        font-weight: 700;
                        text-align: center;
                        border: 1px solid rgba(52, 211, 153, 0.3);
                    ">
                        <i class="fas fa-check-circle" style="margin-right: 4px;"></i>
                        In-Service
                    </div>
                    ` : `
                    <div style="
                        width: 100%;
                        padding: 8px;
                        border-radius: 6px;
                        background: linear-gradient(145deg, #1e1f42, #2a2b5e);
                        box-shadow: 
                            inset 2px 2px 4px #151631,
                            inset -2px -2px 4px #353779;
                        color: #f87171;
                        font-size: 10px;
                        font-weight: 700;
                        text-align: center;
                        border: 1px solid rgba(248, 113, 113, 0.3);
                    ">
                        <i class="fas fa-parking" style="margin-right: 4px;"></i>
                        Not In-Service
                    </div>
                    `}
                </div>
            </div>
        `;

        // Bind popup with autoClose: true to close others when opening
        marker.bindPopup(popupContent, {
            autoPan: true,
            closeButton: true,
            className: 'neumorphic-popup',
            autoClose: true,        // Close other popups when opening this one
            closeOnClick: true     // Keep open when clicking map, but close when opening another
        });

        marker.on('click', function(e) {
            this.openPopup();
        });

        window.staticBusMarkers.push(marker);
    });
}

/**
 * Track bus function - Compact neumorphic modal
 */
function trackBus(busId) {
    const bus = BUS_STOPS.find(b => b.id === busId);
    if (bus) {
        const alertBox = document.createElement('div');
        alertBox.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(145deg, #2a2b5e, #1e1f42);
            box-shadow: 
                20px 20px 60px rgba(0,0,0,0.5),
                -5px -5px 20px rgba(255,255,255,0.05);
            border-radius: 16px;
            padding: 24px;
            z-index: 10000;
            text-align: center;
            min-width: 240px;
            border: 1px solid rgba(253, 227, 56, 0.2);
        `;
        alertBox.innerHTML = `
            <div style="
                width: 56px;
                height: 56px;
                margin: 0 auto 16px;
                border-radius: 50%;
                background: linear-gradient(145deg, #1e1f42, #2a2b5e);
                box-shadow: 
                    4px 4px 8px #151631,
                    -4px -4px 8px #353779,
                    inset 2px 2px 4px rgba(255,255,255,0.1);
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <i class="fas fa-satellite-dish" style="color: #34d399; font-size: 24px; filter: drop-shadow(0 0 8px rgba(52,211,153,0.5));"></i>
            </div>
            <h3 style="color: #fff; margin: 0 0 8px 0; font-size: 18px; font-weight: 700;">Tracking ${busId}</h3>
            <p style="color: #8b8db9; margin: 0 0 16px 0; font-size: 13px; line-height: 1.5;">
                ${bus.location}<br>
                Driver: ${bus.driver}<br>
                ETA: ${bus.eta}
            </p>
            <button onclick="this.parentElement.remove(); document.getElementById('modalOverlay')?.remove();" style="
                padding: 10px 24px;
                border: none;
                border-radius: 8px;
                background: linear-gradient(145deg, #fde338, #e6cc32);
                box-shadow: 
                    3px 3px 6px #151631,
                    -3px -3px 6px #353779,
                    inset 1px 1px 2px rgba(255,255,255,0.3);
                color: #242552;
                font-weight: 800;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s ease;
            " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">Close</button>
        `;
        
        const overlay = document.createElement('div');
        overlay.id = 'modalOverlay';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(4px);
            z-index: 9999;
        `;
        overlay.onclick = () => {
            alertBox.remove();
            overlay.remove();
        };
        
        document.body.appendChild(overlay);
        document.body.appendChild(alertBox);
    }
}

// Neumorphic CSS styles
const mapStyles = document.createElement('style');
mapStyles.textContent = `
    .neumorphic-bus-pin {
        background: transparent !important;
        border: none !important;
    }
    
    .leaflet-marker-icon {
        transition: none !important;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.05); }
    }
    
    @keyframes ripple {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
        100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
    }
    
    /* Neumorphic Popup Styling */
    .neumorphic-popup .leaflet-popup-content-wrapper {
        background: linear-gradient(145deg, #242552, #1e1f42) !important;
        border-radius: 10px !important;
        box-shadow: 
            8px 8px 16px rgba(0,0,0,0.4),
            -4px -4px 12px rgba(255,255,255,0.05),
            inset 1px 1px 1px rgba(255,255,255,0.1) !important;
        border: 1px solid rgba(255,255,255,0.08) !important;
        padding: 0 !important;
        overflow: hidden;
    }
    
    .neumorphic-popup .leaflet-popup-content {
        margin: 10px !important;
        line-height: 1.4 !important;
    }
    
    .neumorphic-popup .leaflet-popup-tip {
        background: linear-gradient(145deg, #242552, #1e1f42) !important;
        box-shadow: 
            4px 4px 8px rgba(0,0,0,0.3),
            -2px -2px 6px rgba(255,255,255,0.05) !important;
        border: 1px solid rgba(255,255,255,0.08) !important;
        width: 12px !important;
        height: 12px !important;
        margin: -6px auto 0 !important;
    }
    
    .neumorphic-popup .leaflet-popup-close-button {
        color: #fde338 !important;
        font-size: 16px !important;
        width: 24px !important;
        height: 24px !important;
        top: 6px !important;
        right: 6px !important;
        border-radius: 50% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: all 0.2s ease !important;
        background: linear-gradient(145deg, #1e1f42, #2a2b5e) !important;
        box-shadow: 
            2px 2px 4px #151631,
            -2px -2px 4px #353779 !important;
        padding: 0 !important;
        line-height: 1 !important;
    }
    
    .neumorphic-popup .leaflet-popup-close-button:hover {
        background: linear-gradient(145deg, #2a2b5e, #1e1f42) !important;
        box-shadow: 
            inset 2px 2px 4px #151631,
            inset -2px -2px 4px #353779 !important;
        transform: rotate(90deg) !important;
    }
    
    .leaflet-popup {
        z-index: 1000 !important;
    }
    
    .location-marker {
        background: transparent !important;
        border: none !important;
    }
`;
document.head.appendChild(mapStyles);

/**
 * Setup fullscreen toggle
 */
function setupFullscreen() {
    const toggleBtn = document.getElementById('fullscreenToggle');
    const mapSection = document.getElementById('mapSection');
    
    if (!toggleBtn || !mapSection) return;
    
    toggleBtn.addEventListener('click', () => {
        isFullscreen = !isFullscreen;
        
        if (isFullscreen) {
            mapSection.classList.add('fullscreen');
            toggleBtn.innerHTML = '<i class="fas fa-compress"></i> Exit';
        } else {
            mapSection.classList.remove('fullscreen');
            toggleBtn.innerHTML = '<i class="fas fa-expand"></i> Fullscreen';
        }
        
        setTimeout(() => {
            if (trackingMap) trackingMap.invalidateSize();
        }, 300);
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isFullscreen) {
            isFullscreen = false;
            mapSection.classList.remove('fullscreen');
            toggleBtn.innerHTML = '<i class="fas fa-expand"></i> Fullscreen';
            setTimeout(() => {
                if (trackingMap) trackingMap.invalidateSize();
            }, 300);
        }
    });
}




// Refresh button handler
document.getElementById('refreshTracking')?.addEventListener('click', function() {
    const icon = this.querySelector('i');
    icon.style.animation = 'spin 1s linear';
    setTimeout(() => icon.style.animation = '', 1000);
    
    if (trackingMap) {
        trackingMap.invalidateSize();
    }
});