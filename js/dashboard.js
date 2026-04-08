/**
 * ============================================
 * DASHBOARD MODULE
 * Modern Bus Management System
 * ============================================
 */

// Global state
let currentPage = 'dashboard';
let dashboardMap = null;
let trackingMap = null;
let busMarkers = [];

// Route editor globals
let routeMarkers = [];
let routePolyline = null;
let routeControls = null;
let selectedMarker = null;
let markersVisible = false; // New: track marker visibility state

// Default route coordinates (Bohol route)
const defaultRouteCoordinates = [
    [9.659424, 123.859424],
    [9.659559, 123.859481],
    [9.659704, 123.859449],
    [9.659862, 123.859401],
    [9.659957, 123.859297],
    [9.660222, 123.858953],
    [9.660278, 123.858921],
    [9.660310, 123.858956],
    [9.659691, 123.861164],
    [9.659401, 123.861220],
    [9.659241, 123.861276],
    [9.659025, 123.862529],
    [9.659124, 123.863410],
    [9.659047, 123.863678],
    [9.657293, 123.866440],
    [9.657211, 123.866357],
    [9.656932, 123.866573],
    [9.655145, 123.866604],
    [9.654835, 123.866810],
    [9.654778, 123.868428],
    [9.654784, 123.870194],
    [9.654937, 123.870401],
    [9.656023, 123.870446],
    [9.656061, 123.870498],
    [9.656068, 123.872493],
    [9.655991, 123.872584],
    [9.654734, 123.872577],
    [9.654652, 123.872472],
    [9.654619, 123.866903],
    [9.654521, 123.866745],
    [9.653297, 123.867024],
    [9.652086, 123.866964],
    [9.651421, 123.866674],
    [9.650721, 123.866078],
    [9.650114, 123.865652],
    [9.649433, 123.865404],
    [9.647184, 123.863801],
    [9.645988563697694, 123.86348036349916],
    [9.643360550113842, 123.86060857495146],
    [9.640957, 123.858275],
    [9.639784, 123.856970],
    [9.640561, 123.855994],
    [9.641790, 123.855715],
    [9.644996, 123.855298],
    [9.646355, 123.855263],
    [9.650043, 123.855306],
    [9.654573, 123.855428],
    [9.655464, 123.855495],
    [9.658643, 123.856258],
    [9.659606, 123.856502],
    [9.660737, 123.856886],
    [9.660749, 123.856912],
    [9.660325, 123.858861],
    [9.660084, 123.859148],
    [9.659858, 123.859372],
    [9.659681, 123.859477],
    [9.659514, 123.859482],
    [9.659337, 123.859427]
];

/**
 * ============================================
 * AVATAR & USER INFO MODULE
 * ============================================
 */

function generateAvatar(username, elementId) {
    const colors = [
        '#fde338', '#60a5fa', '#34d399', '#f87171', '#a78bfa',
        '#fbbf24', '#22d3ee', '#fb7185', '#a3e635', '#c084fc'
    ];
    
    const initials = username
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
    
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    const bgColor = colors[colorIndex];
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg " viewBox="0 0 100 100">
        <rect width="100" height="100" fill="${bgColor}" rx="50"/>
        <text x="50" y="50" dy=".35em" text-anchor="middle" fill="#242552" 
              font-size="40" font-weight="700" font-family="Segoe UI, sans-serif">${initials}</text>
    </svg>`;
    
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const img = document.getElementById(elementId);
    if (img) img.src = url;
    
    return { initials, bgColor, url };
}

function initUserInfo() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    const userNameShort = document.getElementById('userNameShort');
    const welcomeUsername = document.getElementById('welcomeUsername');
    
    if (userNameShort) userNameShort.textContent = user.fullName;
    if (welcomeUsername) welcomeUsername.textContent = user.fullName.split(' ')[0];
    
    const dropdownName = document.getElementById('dropdownName');
    const dropdownRole = document.getElementById('dropdownRole');
    
    if (dropdownName) dropdownName.textContent = user.fullName;
    if (dropdownRole) dropdownRole.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    
    generateAvatar(user.fullName, 'userAvatarImg');
    generateAvatar(user.fullName, 'dropdownAvatar');
    
    const settingsFullName = document.getElementById('settingsFullName');
    const settingsEmail = document.getElementById('settingsEmail');
    const settingsRole = document.getElementById('settingsRole');
    
    if (settingsFullName) settingsFullName.value = user.fullName;
    if (settingsEmail) settingsEmail.value = user.email;
    if (settingsRole) settingsRole.value = user.role.charAt(0).toUpperCase() + user.role.slice(1);
}

/**
 * ============================================
 * ROUTE EDITOR FUNCTIONS
 * ============================================
 */

function loadCoordinates() {
    const saved = localStorage.getItem('boholRouteCoordinates');
    return saved ? JSON.parse(saved) : defaultRouteCoordinates;
}

function saveCoordinates(coords) {
    localStorage.setItem('boholRouteCoordinates', JSON.stringify(coords));
    console.log('Route coordinates saved:', coords);
    showRouteNotification('Route saved successfully!', 'success');
}

function showRouteNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: inherit;
        font-size: 14px;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function updatePolyline() {
    if (routePolyline) {
        const newCoords = routeMarkers.map(marker => {
            const latLng = marker.getLatLng();
            return [latLng.lat, latLng.lng];
        });
        routePolyline.setLatLngs(newCoords);
    }
}

function showRouteEditor() {
    if (routeControls) {
        routeControls.style.display = 'flex';
    }
}

function hideRouteEditor() {
    if (routeControls) {
        routeControls.style.display = 'none';
    }
    selectedMarker = null;
}

// New: Toggle markers visibility
function toggleMarkersVisibility(map, show) {
    markersVisible = show;
    routeMarkers.forEach(marker => {
        if (show) {
            marker.addTo(map);
        } else {
            map.removeLayer(marker);
        }
    });
    
    if (show) {
        showRouteNotification('Edit mode: Drag markers to adjust route', 'info');
    } else {
        hideRouteEditor();
        selectedMarker = null;
    }
}

function createRouteControls(mapInstance) {
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'route-controls';
    controlsDiv.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 1000;
        background: rgba(30, 41, 59, 0.95);
        padding: 15px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        display: none;
        flex-direction: column;
        gap: 10px;
        min-width: 200px;
        border: 1px solid rgba(255,255,255,0.1);
    `;

    controlsDiv.innerHTML = `
        <h4 style="margin: 0 0 10px 0; color: #f8fafc; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
            <i class="fas fa-route"></i> Route Editor
        </h4>
        <div id="selectedPointInfo" style="margin-bottom: 10px; padding: 10px; background: rgba(59, 130, 246, 0.2); border-radius: 6px; font-size: 12px; color: #93c5fd;">
            <i class="fas fa-mouse-pointer"></i> Click a marker to edit
        </div>
        <button id="btnSaveRoute" style="
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
        ">
            <i class="fas fa-save"></i> Save Route
        </button>
        <button id="btnExportRoute" style="
            background: #10b981;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
        ">
            <i class="fas fa-copy"></i> Copy Coords
        </button>
        <button id="btnResetRoute" style="
            background: #ef4444;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
        ">
            <i class="fas fa-undo"></i> Reset Default
        </button>
        <button id="btnAddPoint" style="
            background: #8b5cf6;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
        ">
            <i class="fas fa-plus"></i> Add Point
        </button>
        <button id="btnDeletePoint" style="
            background: #f59e0b;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
            opacity: 0.5;
            pointer-events: none;
        ">
            <i class="fas fa-trash"></i> Delete Point
        </button>
        <button id="btnHideMarkers" style="
            background: #64748b;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
            margin-top: 5px;
        ">
            <i class="fas fa-eye-slash"></i> Hide Markers
        </button>
    `;

    // Event listeners
    controlsDiv.querySelector('#btnSaveRoute').addEventListener('click', function() {
        const coords = routeMarkers.map(m => {
            const pos = m.getLatLng();
            return [pos.lat, pos.lng];
        });
        saveCoordinates(coords);
    });

    controlsDiv.querySelector('#btnExportRoute').addEventListener('click', function() {
        const coords = routeMarkers.map(marker => {
            const latLng = marker.getLatLng();
            return `${latLng.lat}, ${latLng.lng}`;
        }).join('\n');
        
        navigator.clipboard.writeText(coords).then(() => {
            showRouteNotification('Coordinates copied to clipboard!', 'success');
        }).catch(() => {
            prompt('Copy these coordinates:', coords);
        });
    });

    controlsDiv.querySelector('#btnResetRoute').addEventListener('click', function() {
        if (confirm('Reset to default route? All changes will be lost.')) {
            localStorage.removeItem('boholRouteCoordinates');
            location.reload();
        }
    });

    controlsDiv.querySelector('#btnAddPoint').addEventListener('click', function() {
        const center = mapInstance.getCenter();
        const newIndex = routeMarkers.length;
        const newMarker = createDraggableMarker(center.lat, center.lng, newIndex, mapInstance);
        routeMarkers.push(newMarker);
        updatePolyline();
        
        const coords = routeMarkers.map(m => {
            const pos = m.getLatLng();
            return [pos.lat, pos.lng];
        });
        saveCoordinates(coords);
        
        selectMarker(newMarker, mapInstance);
        showRouteNotification('New point added! Drag to position.', 'success');
    });

    controlsDiv.querySelector('#btnDeletePoint').addEventListener('click', function() {
        if (selectedMarker && routeMarkers.length > 2) {
            const index = routeMarkers.indexOf(selectedMarker);
            if (index > -1) {
                mapInstance.removeLayer(selectedMarker);
                routeMarkers.splice(index, 1);
                
                routeMarkers.forEach((m, i) => {
                    m.pointIndex = i;
                });
                
                updatePolyline();
                
                const coords = routeMarkers.map(m => {
                    const pos = m.getLatLng();
                    return [pos.lat, pos.lng];
                });
                saveCoordinates(coords);
                
                selectedMarker = null;
                updateSelectedPointInfo();
                showRouteNotification('Point deleted!', 'success');
            }
        } else {
            showRouteNotification('Cannot delete - minimum 2 points required!', 'error');
        }
    });

    // New: Hide markers button
    controlsDiv.querySelector('#btnHideMarkers').addEventListener('click', function() {
        toggleMarkersVisibility(mapInstance, false);
    });

    const buttons = controlsDiv.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.filter = 'brightness(1.1)';
        });
        btn.addEventListener('mouseleave', function() {
            this.style.filter = 'brightness(1)';
        });
    });

    return controlsDiv;
}

function updateSelectedPointInfo() {
    const infoDiv = routeControls.querySelector('#selectedPointInfo');
    const deleteBtn = routeControls.querySelector('#btnDeletePoint');
    
    if (selectedMarker) {
        const latLng = selectedMarker.getLatLng();
        infoDiv.innerHTML = `
            <i class="fas fa-map-pin"></i> <strong>Point ${selectedMarker.pointIndex + 1}</strong><br>
            Lat: ${latLng.lat.toFixed(6)}<br>
            Lng: ${latLng.lng.toFixed(6)}
        `;
        infoDiv.style.background = 'rgba(16, 185, 129, 0.2)';
        infoDiv.style.color = '#6ee7b7';
        
        deleteBtn.style.opacity = '1';
        deleteBtn.style.pointerEvents = 'auto';
    } else {
        infoDiv.innerHTML = `<i class="fas fa-mouse-pointer"></i> Click a marker to edit`;
        infoDiv.style.background = 'rgba(59, 130, 246, 0.2)';
        infoDiv.style.color = '#93c5fd';
        
        deleteBtn.style.opacity = '0.5';
        deleteBtn.style.pointerEvents = 'none';
    }
}

function selectMarker(marker, mapInstance) {
    routeMarkers.forEach(m => {
        m.getElement().querySelector('div').style.transform = 'scale(1)';
        m.getElement().querySelector('div').style.background = '#0066ff';
        m.getElement().querySelector('div').style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
    });
    
    selectedMarker = marker;
    marker.getElement().querySelector('div').style.transform = 'scale(1.4)';
    marker.getElement().querySelector('div').style.background = '#f59e0b';
    marker.getElement().querySelector('div').style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.6)';
    
    updateSelectedPointInfo();
}

function createDraggableMarker(lat, lng, index, mapInstance) {
    const customIcon = L.divIcon({
        className: 'custom-route-marker',
        html: `<div style="
            width: 14px;
            height: 14px;
            background: #fde338;
            border: 2px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            cursor: pointer;
            transition: all 0.2s ease;
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });

    const marker = L.marker([lat, lng], {
        icon: customIcon,
        draggable: true,
        title: `Point ${index + 1}`
    });

    marker.pointIndex = index;

    marker.on('click', function(e) {
        L.DomEvent.stopPropagation(e);
        selectMarker(this, mapInstance);
    });

    marker.on('dragstart', function() {
        const el = this.getElement();
        if (el) {
            const div = el.querySelector('div');
            div.style.cursor = 'grabbing';
            div.style.transform = 'scale(1.3)';
        }
        if (selectedMarker !== this) {
            selectMarker(this, mapInstance);
        }
    });

    marker.on('drag', function() {
        updatePolyline();
        if (selectedMarker === this) {
            updateSelectedPointInfo();
        }
    });

    marker.on('dragend', function() {
        const el = this.getElement();
        if (el) {
            const div = el.querySelector('div');
            div.style.cursor = 'pointer';
        }
        updatePolyline();
        updateSelectedPointInfo();
        
        const currentCoords = routeMarkers.map(m => {
            const pos = m.getLatLng();
            return [pos.lat, pos.lng];
        });
        saveCoordinates(currentCoords);
    });

    marker.on('mouseover', function() {
        if (selectedMarker !== this) {
            const el = this.getElement();
            if (el) {
                el.querySelector('div').style.transform = 'scale(1.2)';
            }
        }
    });

    marker.on('mouseout', function() {
        if (selectedMarker !== this) {
            const el = this.getElement();
            if (el) {
                el.querySelector('div').style.transform = 'scale(1)';
            }
        }
    });

    return marker;
}

function selectMarker(marker, mapInstance) {
    // Reset all markers
    routeMarkers.forEach(m => {
        const el = m.getElement();
        if (el) {
            const div = el.querySelector('div');
            div.style.transform = 'scale(1)';
            div.style.background = '#fde338';
            div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
        }
    });
    
    // Highlight selected
    selectedMarker = marker;
    const selectedEl = marker.getElement();
    if (selectedEl) {
        const div = selectedEl.querySelector('div');
        div.style.transform = 'scale(1.4)';
        div.style.background = '#f59e0b';
        div.style.boxShadow = '0 0 0 3px #f59e0b, 0 4px 12px rgba(245, 158, 11, 0.5)';
    }
    
    updateSelectedPointInfo();
}

function addBoholRoute(map, isTrackingMap = false) {
    if (!map) return;

    // Clear existing layers
    map.eachLayer(function(layer) {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
            map.removeLayer(layer);
        }
    });

    // Reset state
    routeMarkers = [];
    selectedMarker = null;
    markersVisible = false;
    hideRouteEditor();

    // Load coordinates
    const coordinates = loadCoordinates();

    // Create markers (hidden by default)
    coordinates.forEach((coord, index) => {
        const marker = createDraggableMarker(coord[0], coord[1], index, map);
        routeMarkers.push(marker);
    });

    // Create themed polyline - yellow to match theme
    routePolyline = L.polyline(coordinates, {
        color: '#486ad3ff', // Primary yellow
        weight: 5,
        opacity: 0.9,
        smoothFactor: 1,
        lineJoin: 'round',
        lineCap: 'round',
        interactive: true
    }).addTo(map);

    // Add subtle glow effect
    const glowPolyline = L.polyline(coordinates, {
        color: '#fde338',
        weight: 10,
        opacity: 0.15,
        smoothFactor: 1,
        lineJoin: 'round',
        lineCap: 'round',
        interactive: false
    }).addTo(map);
    glowPolyline.bringToBack();

    // Add edit capability for tracking map
    if (isTrackingMap) {
        routePolyline.on('dblclick', function(e) {
            L.DomEvent.stopPropagation(e);
            if (!markersVisible) {
                toggleMarkersVisibility(map, true);
                showRouteEditor();
            }
        });

        // Click outside to hide markers
        map.on('click', function(e) {
            if (markersVisible) {
                let clickedMarker = false;
                routeMarkers.forEach(m => {
                    if (m.getLatLng && map.latLngToContainerPoint(m.getLatLng()).distanceTo(map.latLngToContainerPoint(e.latlng)) < 20) {
                        clickedMarker = true;
                    }
                });
                
                if (!clickedMarker && !e.originalEvent.target.closest('.route-controls')) {
                    toggleMarkersVisibility(map, false);
                }
            }
        });

        // Create and add route controls
        routeControls = createRouteControls(map);
        const mapContainer = map.getContainer();
        mapContainer.style.position = 'relative';
        mapContainer.appendChild(routeControls);
    }

    // Fit bounds
    map.fitBounds(routePolyline.getBounds(), { 
        padding: [50, 50],
        maxZoom: 16
    });
}

/**
 * ============================================
 * MAP INITIALIZATION
 * ============================================
 */

function initDashboardMap() {
    const container = document.getElementById('dashboardMap');
    if (!container) return;
    
    if (dashboardMap) {
        dashboardMap.remove();
    }
    
    dashboardMap = L.map('dashboardMap', {
        zoomControl: false,
        attributionControl: false
    }).setView([9.659424, 123.859424], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(dashboardMap);
    
    // Add Bohol route to dashboard map (view only, no editor controls, no double-click)
    addBoholRoute(dashboardMap, false);
    
    // Add resize observer
    const resizeObserver = new ResizeObserver(() => {
        if (dashboardMap) dashboardMap.invalidateSize();
    });
    resizeObserver.observe(container);
}

function initTrackingMap() {
    const container = document.getElementById('trackingMap');
    if (!container) return;
    
    // Cleanup existing map
    if (trackingMap) {
        if (trackingMap._cleanup) trackingMap._cleanup();
        trackingMap.remove();
        trackingMap = null;
    }
    
    setTimeout(() => {
        // Initialize map
        trackingMap = L.map('trackingMap', {
            zoomControl: true,
            attributionControl: false
        }).setView([9.659424, 123.859424], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(trackingMap);
        
        // Add themed Bohol route with edit capability
        addBoholRoute(trackingMap, true);
        
        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
            if (trackingMap) trackingMap.invalidateSize();
        });
        resizeObserver.observe(container);
        
        // Store cleanup
        trackingMap._cleanup = () => {
            resizeObserver.disconnect();
        };
        
    }, 100);
}

/**
 * ============================================
 * MAIN INITIALIZATION
 * ============================================
 */

document.addEventListener('DOMContentLoaded', function() {
    if (!Auth.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    initUserInfo();
    initNavigation();
    
    const hash = window.location.hash.slice(1) || 'dashboard';
    navigateToPage(hash);
    
    initRoleBasedUI();
    loadDashboardData();
    initSearchHandlers();
    initModalHandlers();
    initDropdownHandlers();
    initNotifications();
});

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            navigateToPage(page);
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            document.getElementById('sidebar').classList.remove('mobile-open');
            document.getElementById('sidebarOverlay').classList.remove('active');
        });
    });

    document.querySelectorAll('[data-page]:not(.nav-link)').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            navigateToPage(page);
            
            document.querySelectorAll('.nav-link').forEach(l => {
                l.classList.remove('active');
                if (l.getAttribute('data-page') === page) {
                    l.classList.add('active');
                }
            });
        });
    });
}

function navigateToPage(page) {
    currentPage = page;
    
    // Close dropdown
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) dropdown.classList.remove('active');
    
    // Update URL hash
    window.location.hash = page;
    
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    
    // Show target page
    const targetPage = document.getElementById(page + '-page');
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }
    
    // Update header title
    updatePageTitle(page);
    
    // Update sidebar active state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === page) {
            link.classList.add('active');
        }
    });
    
    // Close mobile sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');
    
    // Page-specific initialization
    switch(page) {
        case 'dashboard':
            loadDashboardData();
            setTimeout(() => initDashboardMap(), 100);
            break;
        case 'live-tracking':
            loadDashboardData(); // Load stats and recent activity
            setTimeout(() => initTrackingMap(), 100);
            break;
        case 'bus-info':
            if (typeof renderBusTable === 'function') renderBusTable();
            break;
        case 'schedule':
            if (typeof renderScheduleTable === 'function') renderScheduleTable();
            break;
        case 'feedback':
            if (typeof renderFeedbackGrid === 'function') renderFeedbackGrid();
            break;
        case 'accounts':
            if (typeof renderAccountTable === 'function') renderAccountTable();
            break;
        case 'notifications':
            setTimeout(initNotificationsPage, 0);
            break;
    }
}

function updatePageTitle(page) {
    const titles = {
        'dashboard': { title: 'Dashboard' },
        'live-tracking': { title: 'Live Tracking' },
        'bus-info': { title: 'Bus Information' },
        'schedule': { title: 'Bus Schedule' },
        'feedback': { title: 'Customer Feedback' },
        'accounts': { title: 'Account Management' },
        'settings': { title: 'Settings' }
    };
    
    const pageInfo = titles[page] || titles['dashboard'];
    const pageTitle = document.getElementById('pageTitle');
    
    if (pageTitle) {
        pageTitle.textContent = pageInfo.title;
    }
}

function initRoleBasedUI() {
    const isAdmin = Auth.isAdmin();
    const isStaff = Auth.isStaff();
    
    document.querySelectorAll('.staff-only').forEach(el => {
        el.classList.toggle('hidden', !isStaff);
    });
    
    document.querySelectorAll('.admin-only').forEach(el => {
        el.classList.toggle('hidden', !isAdmin);
    });
    
    if (isAdmin) {
        document.getElementById('busReadOnlyBanner')?.classList.remove('hidden');
        document.getElementById('scheduleReadOnlyBanner')?.classList.remove('hidden');
        document.getElementById('feedbackReadOnlyBanner')?.classList.remove('hidden');
        document.getElementById('accountsReadOnlyBanner')?.classList.remove('hidden');
    }
}

/**
 * Load dashboard statistics - UPDATED to populate both dashboard and live-tracking
 */
function loadDashboardData() {
    const buses = JSON.parse(localStorage.getItem('buses') || '[]');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const feedback = JSON.parse(localStorage.getItem('feedback') || '[]');
    
    // Update stats - Dashboard elements
    const totalBusesEl = document.getElementById('totalBuses');
    const activeBusesEl = document.getElementById('activeBuses');
    const totalStaffEl = document.getElementById('totalStaff');
    const totalFeedbackEl = document.getElementById('totalFeedback');
    
    // Update stats - Live Tracking elements (new IDs)
    const trackingTotalBusesEl = document.getElementById('trackingTotalBuses');
    const trackingActiveBusesEl = document.getElementById('trackingActiveBuses');
    const trackingTotalStaffEl = document.getElementById('trackingTotalStaff');
    const trackingTotalFeedbackEl = document.getElementById('trackingTotalFeedback');
    
    // Set values for dashboard
    if (totalBusesEl) totalBusesEl.textContent = buses.length;
    if (activeBusesEl) activeBusesEl.textContent = buses.filter(b => b.status === 'active').length;
    if (totalStaffEl) totalStaffEl.textContent = users.length;
    if (totalFeedbackEl) totalFeedbackEl.textContent = feedback.length;
    
    // Set values for live tracking page
    if (trackingTotalBusesEl) trackingTotalBusesEl.textContent = buses.length;
    if (trackingActiveBusesEl) trackingActiveBusesEl.textContent = buses.filter(b => b.status === 'active').length;
    if (trackingTotalStaffEl) trackingTotalStaffEl.textContent = users.length;
    if (trackingTotalFeedbackEl) trackingTotalFeedbackEl.textContent = feedback.length;
    
    // Update recent activity table - Dashboard
    const recentActivityTable = document.getElementById('recentActivityTable');
    if (recentActivityTable) {
        recentActivityTable.innerHTML = buses.slice(0, 5).map(bus => `
            <tr>
                <td><strong>${bus.id}</strong></td>
                <td>${bus.driver}</td>
                <td>${bus.route}</td>
                <td><span class="status-badge ${bus.status}">${bus.status}</span></td>
                <td>${new Date().toLocaleTimeString()}</td>
            </tr>
        `).join('');
    }
    
    // Update recent activity table - Live Tracking (new ID)
    const trackingRecentActivityTable = document.getElementById('trackingRecentActivityTable');
    if (trackingRecentActivityTable) {
        trackingRecentActivityTable.innerHTML = buses.slice(0, 5).map(bus => `
            <tr>
                <td><strong>${bus.id}</strong></td>
                <td>${bus.driver}</td>
                <td>${bus.route}</td>
                <td><span class="status-badge ${bus.status}">${bus.status}</span></td>
                <td>${new Date().toLocaleTimeString()}</td>
            </tr>
        `).join('');
    }
}

// ==================== BUS MANAGEMENT ====================

function renderBusTable() {
    const buses = JSON.parse(localStorage.getItem('buses') || '[]');
    const searchTerm = document.getElementById('busSearch')?.value.toLowerCase() || '';
    
    const filteredBuses = buses.filter(bus => 
        bus.id.toLowerCase().includes(searchTerm) ||
        bus.driver.toLowerCase().includes(searchTerm) ||
        bus.route.toLowerCase().includes(searchTerm)
    );
    
    const tbody = document.getElementById('busTableBody');
    const isStaff = Auth.isStaff();
    
    tbody.innerHTML = filteredBuses.map(bus => `
        <tr>
            <td><strong>${bus.id}</strong></td>
            <td>${bus.driver}</td>
            <td>${bus.route}</td>
            <td><span class="status-badge ${bus.status}">${bus.status}</span></td>
            <td>${bus.capacity} seats</td>
            <td>
                <div class="table-actions">
                    ${isStaff ? `
                        <button class="action-btn edit" onclick="editBus('${bus.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteBus('${bus.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : `
                        <button class="action-btn view" title="View Only">
                            <i class="fas fa-eye"></i>
                        </button>
                    `}
                </div>
            </td>
        </tr>
    `).join('');
}

document.getElementById('addBusBtn')?.addEventListener('click', () => {
    document.getElementById('busForm').reset();
    document.getElementById('busEditId').value = '';
    document.getElementById('busModalTitle').textContent = 'Add Bus';
    openModal('busModal');
});

function editBus(busId) {
    const buses = JSON.parse(localStorage.getItem('buses') || '[]');
    const bus = buses.find(b => b.id === busId);
    
    if (bus) {
        document.getElementById('busEditId').value = bus.id;
        document.getElementById('busId').value = bus.id;
        document.getElementById('busDriver').value = bus.driver;
        document.getElementById('busRoute').value = bus.route;
        document.getElementById('busCapacity').value = bus.capacity;
        document.getElementById('busStatus').value = bus.status;
        document.getElementById('busModalTitle').textContent = 'Edit Bus';
        openModal('busModal');
    }
}

function saveBus() {
    const editId = document.getElementById('busEditId').value;
    const busData = {
        id: document.getElementById('busId').value,
        driver: document.getElementById('busDriver').value,
        route: document.getElementById('busRoute').value,
        capacity: parseInt(document.getElementById('busCapacity').value),
        status: document.getElementById('busStatus').value,
        lat: 40.7128 + (Math.random() - 0.5) * 0.1,
        lng: -74.0060 + (Math.random() - 0.5) * 0.1
    };
    
    let buses = JSON.parse(localStorage.getItem('buses') || '[]');
    
    if (editId) {
        const index = buses.findIndex(b => b.id === editId);
        if (index !== -1) {
            buses[index] = { ...buses[index], ...busData };
        }
    } else {
        if (buses.some(b => b.id === busData.id)) {
            alert('Bus ID already exists!');
            return;
        }
        buses.push(busData);
    }
    
    localStorage.setItem('buses', JSON.stringify(buses));
    closeModal('busModal');
    renderBusTable();
    loadDashboardData();
}

function deleteBus(busId) {
    if (confirm('Are you sure you want to delete this bus?')) {
        let buses = JSON.parse(localStorage.getItem('buses') || '[]');
        buses = buses.filter(b => b.id !== busId);
        localStorage.setItem('buses', JSON.stringify(buses));
        renderBusTable();
        loadDashboardData();
    }
}

// ==================== SCHEDULE MANAGEMENT ====================

function renderScheduleTable() {
    const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
    const buses = JSON.parse(localStorage.getItem('buses') || '[]');
    const searchTerm = document.getElementById('scheduleSearch')?.value.toLowerCase() || '';
    
    const filteredSchedules = schedules.filter(sch => 
        sch.route.toLowerCase().includes(searchTerm) ||
        sch.busId.toLowerCase().includes(searchTerm)
    );
    
    const tbody = document.getElementById('scheduleTableBody');
    const isStaff = Auth.isStaff();
    
    tbody.innerHTML = filteredSchedules.map(sch => `
        <tr>
            <td>${sch.route}</td>
            <td><strong>${sch.busId}</strong></td>
            <td>${sch.departure}</td>
            <td>${sch.arrival}</td>
            <td>${sch.frequency}</td>
            <td>
                <div class="table-actions">
                    ${isStaff ? `
                        <button class="action-btn edit" onclick="editSchedule('${sch.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteSchedule('${sch.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : `
                        <button class="action-btn view" title="View Only">
                            <i class="fas fa-eye"></i>
                        </button>
                    `}
                </div>
            </td>
        </tr>
    `).join('');
}

function populateBusSelect() {
    const buses = JSON.parse(localStorage.getItem('buses') || '[]');
    const select = document.getElementById('scheduleBusId');
    select.innerHTML = buses.map(bus => `
        <option value="${bus.id}">${bus.id} - ${bus.driver}</option>
    `).join('');
}

document.getElementById('addScheduleBtn')?.addEventListener('click', () => {
    document.getElementById('scheduleForm').reset();
    document.getElementById('scheduleEditId').value = '';
    document.getElementById('scheduleModalTitle').textContent = 'Add Schedule';
    populateBusSelect();
    openModal('scheduleModal');
});

function editSchedule(scheduleId) {
    const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
    const schedule = schedules.find(s => s.id === scheduleId);
    
    if (schedule) {
        document.getElementById('scheduleEditId').value = schedule.id;
        document.getElementById('scheduleRoute').value = schedule.route;
        populateBusSelect();
        document.getElementById('scheduleBusId').value = schedule.busId;
        document.getElementById('scheduleDeparture').value = schedule.departure;
        document.getElementById('scheduleArrival').value = schedule.arrival;
        document.getElementById('scheduleFrequency').value = schedule.frequency;
        document.getElementById('scheduleModalTitle').textContent = 'Edit Schedule';
        openModal('scheduleModal');
    }
}

function saveSchedule() {
    const editId = document.getElementById('scheduleEditId').value;
    const scheduleData = {
        id: editId || 'SCH-' + String(Date.now()).slice(-6),
        route: document.getElementById('scheduleRoute').value,
        busId: document.getElementById('scheduleBusId').value,
        departure: document.getElementById('scheduleDeparture').value,
        arrival: document.getElementById('scheduleArrival').value,
        frequency: document.getElementById('scheduleFrequency').value
    };
    
    let schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
    
    if (editId) {
        const index = schedules.findIndex(s => s.id === editId);
        if (index !== -1) {
            schedules[index] = scheduleData;
        }
    } else {
        schedules.push(scheduleData);
    }
    
    localStorage.setItem('schedules', JSON.stringify(schedules));
    closeModal('scheduleModal');
    renderScheduleTable();
}

function deleteSchedule(scheduleId) {
    if (confirm('Are you sure you want to delete this schedule?')) {
        let schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
        schedules = schedules.filter(s => s.id !== scheduleId);
        localStorage.setItem('schedules', JSON.stringify(schedules));
        renderScheduleTable();
    }
}

// ==================== FEEDBACK MANAGEMENT ====================

function renderFeedbackGrid() {
    const feedback = JSON.parse(localStorage.getItem('feedback') || '[]');
    const searchTerm = document.getElementById('feedbackSearch')?.value.toLowerCase() || '';
    
    const filteredFeedback = feedback.filter(fb => 
        fb.name.toLowerCase().includes(searchTerm) ||
        fb.message.toLowerCase().includes(searchTerm)
    );
    
    const grid = document.getElementById('feedbackGrid');
    const isStaff = Auth.isStaff();
    
    if (filteredFeedback.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-comments"></i>
                <h3>No feedback found</h3>
                <p>There are no feedback messages matching your search.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filteredFeedback.map(fb => `
        <div class="feedback-card">
            <div class="feedback-header">
                <div class="feedback-avatar">${fb.name.charAt(0).toUpperCase()}</div>
                <div class="feedback-meta">
                    <h4>${fb.name}</h4>
                    <span>${new Date(fb.date).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="feedback-content">${fb.message}</div>
            ${fb.reply ? `
                <div class="feedback-reply">
                    <h5><i class="fas fa-reply"></i> Staff Reply</h5>
                    <p>${fb.reply}</p>
                </div>
            ` : isStaff ? `
                <button class="btn btn-primary btn-sm" onclick="openFeedbackReply('${fb.id}')" style="margin-top: 15px;">
                    <i class="fas fa-reply"></i>
                    Reply
                </button>
            ` : ''}
        </div>
    `).join('');
}

function openFeedbackReply(feedbackId) {
    const feedback = JSON.parse(localStorage.getItem('feedback') || '[]');
    const fb = feedback.find(f => f.id === feedbackId);
    
    if (fb) {
        document.getElementById('feedbackReplyId').value = fb.id;
        document.getElementById('originalFeedback').textContent = fb.message;
        document.getElementById('feedbackReplyText').value = '';
        openModal('feedbackModal');
    }
}

function saveFeedbackReply() {
    const feedbackId = document.getElementById('feedbackReplyId').value;
    const reply = document.getElementById('feedbackReplyText').value.trim();
    
    if (!reply) {
        alert('Please enter a reply message.');
        return;
    }
    
    let feedback = JSON.parse(localStorage.getItem('feedback') || '[]');
    const index = feedback.findIndex(f => f.id === feedbackId);
    
    if (index !== -1) {
        feedback[index].reply = reply;
        localStorage.setItem('feedback', JSON.stringify(feedback));
        closeModal('feedbackModal');
        renderFeedbackGrid();
    }
}

// ==================== ACCOUNT MANAGEMENT ====================

function renderAccountTable() {
    const users = Auth.getAllUsers();
    const currentUser = Auth.getCurrentUser();
    const searchTerm = document.getElementById('accountSearch')?.value.toLowerCase() || '';
    
    const filteredUsers = users.filter(u => 
        u.fullName.toLowerCase().includes(searchTerm) ||
        u.email.toLowerCase().includes(searchTerm)
    );
    
    const tbody = document.getElementById('accountTableBody');
    const isStaff = Auth.isStaff();
    
    tbody.innerHTML = filteredUsers.map(user => `
        <tr>
            <td><strong>${user.id}</strong></td>
            <td>
                ${user.fullName}
                ${user.id === currentUser.id ? '<span style="color: var(--primary-yellow); font-size: 12px;">(You)</span>' : ''}
            </td>
            <td>${user.email}</td>
            <td><span class="role-badge ${user.role}">${user.role}</span></td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="table-actions">
                    ${isStaff ? `
                        <button class="action-btn edit" onclick="editAccount('${user.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${user.id !== currentUser.id ? `
                            <button class="action-btn delete" onclick="deleteAccount('${user.id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    ` : `
                        <button class="action-btn view" title="View Only">
                            <i class="fas fa-eye"></i>
                        </button>
                    `}
                </div>
            </td>
        </tr>
    `).join('');
}

document.getElementById('addAccountBtn')?.addEventListener('click', () => {
    document.getElementById('accountForm').reset();
    document.getElementById('accountEditId').value = '';
    document.getElementById('accountModalTitle').textContent = 'Add Account';
    document.getElementById('accountEmail').readOnly = false;
    document.getElementById('passwordFieldGroup').style.display = 'block';
    document.getElementById('accountPassword').required = true;
    openModal('accountModal');
});

function editAccount(userId) {
    const users = Auth.getAllUsers();
    const user = users.find(u => u.id === userId);
    
    if (user) {
        document.getElementById('accountEditId').value = user.id;
        document.getElementById('accountFullName').value = user.fullName;
        document.getElementById('accountEmail').value = user.email;
        document.getElementById('accountEmail').readOnly = true;
        document.getElementById('accountRole').value = user.role;
        document.getElementById('accountPassword').value = '';
        document.getElementById('accountPassword').required = false;
        document.getElementById('passwordFieldGroup').style.display = 'block';
        document.querySelector('#passwordFieldGroup p').textContent = 'Leave blank to keep current password';
        document.getElementById('accountModalTitle').textContent = 'Edit Account';
        openModal('accountModal');
    }
}

function saveAccount() {
    const editId = document.getElementById('accountEditId').value;
    const userData = {
        fullName: document.getElementById('accountFullName').value,
        email: document.getElementById('accountEmail').value.toLowerCase(),
        role: document.getElementById('accountRole').value,
        password: document.getElementById('accountPassword').value
    };
    
    let result;
    if (editId) {
        const updates = { fullName: userData.fullName, role: userData.role };
        if (userData.password) updates.password = userData.password;
        result = Auth.updateUser(editId, updates);
    } else {
        result = Auth.addUser(userData);
    }
    
    if (result.success) {
        closeModal('accountModal');
        renderAccountTable();
    } else {
        alert(result.message);
    }
}

function deleteAccount(userId) {
    if (confirm('Are you sure you want to delete this account?')) {
        const result = Auth.deleteUser(userId);
        if (result.success) {
            renderAccountTable();
        } else {
            alert(result.message);
        }
    }
}

// ==================== SETTINGS ====================

document.getElementById('editProfileBtn')?.addEventListener('click', function() {
    const fullNameInput = document.getElementById('settingsFullName');
    
    if (this.textContent.includes('Edit')) {
        fullNameInput.readOnly = false;
        fullNameInput.focus();
        this.innerHTML = '<i class="fas fa-save"></i> Save Profile';
    } else {
        const result = Auth.updateProfile({ fullName: fullNameInput.value });
        if (result.success) {
            fullNameInput.readOnly = true;
            this.innerHTML = '<i class="fas fa-edit"></i> Edit Profile';
            initUserInfo();
            alert('Profile updated successfully!');
        } else {
            alert(result.message);
        }
    }
});

document.getElementById('passwordForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    if (newPassword !== confirmNewPassword) {
        alert('New passwords do not match!');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters long!');
        return;
    }
    
    const result = Auth.changePassword(currentPassword, newPassword);
    if (result.success) {
        alert('Password changed successfully!');
        this.reset();
    } else {
        alert(result.message);
    }
});

// ==================== UTILITY FUNCTIONS ====================

function initSearchHandlers() {
    document.getElementById('busSearch')?.addEventListener('input', renderBusTable);
    document.getElementById('scheduleSearch')?.addEventListener('input', renderScheduleTable);
    document.getElementById('feedbackSearch')?.addEventListener('input', renderFeedbackGrid);
    document.getElementById('accountSearch')?.addEventListener('input', renderAccountTable);
}

function initModalHandlers() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
        
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
            const editIdField = form.querySelector('input[type="hidden"][id$="EditId"]');
            if (editIdField) editIdField.value = '';
        }
        
        const customTrigger = modal.querySelector('.custom-select-trigger');
        const customOptions = modal.querySelectorAll('.custom-select-option');
        const nativeSelect = modal.querySelector('select.form-input');
        
        if (customTrigger && nativeSelect) {
            const firstOption = nativeSelect.options[0];
            customTrigger.textContent = firstOption ? firstOption.text : 'Select...';
            customOptions.forEach(opt => opt.classList.remove('selected'));
            if (customOptions[0]) customOptions[0].classList.add('selected');
        }
        
        modal.querySelectorAll('.custom-select-options').forEach(opt => {
            opt.classList.remove('active');
        });
        modal.querySelectorAll('.custom-select-trigger').forEach(trig => {
            trig.classList.remove('active');
        });
    }
}

function initDropdownHandlers() {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const userDropdownToggle = document.getElementById('userDropdownToggle');
    const userDropdown = document.querySelector('.user-dropdown');

    if (notificationBtn && notificationDropdown) {
        notificationBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            if (userDropdown) userDropdown.classList.remove('active');
            notificationDropdown.classList.toggle('active');
        });
        
        document.addEventListener('click', function(e) {
            if (!notificationBtn.contains(e.target) && !notificationDropdown.contains(e.target)) {
                notificationDropdown.classList.remove('active');
            }
        });
        
        document.querySelector('.content')?.addEventListener('scroll', function() {
            notificationDropdown.classList.remove('active');
        });
    }

    if (userDropdownToggle && userDropdown) {
        userDropdownToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            if (notificationDropdown) notificationDropdown.classList.remove('active');
            userDropdown.classList.toggle('active');
        });
        
        document.addEventListener('click', function(e) {
            if (!userDropdownToggle.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('active');
            }
        });
        
        document.querySelector('.content')?.addEventListener('scroll', function() {
            userDropdown.classList.remove('active');
        });
    }
}

// ==================== NOTIFICATIONS ====================

let notificationsData = [
    {
        id: 1,
        type: 'alert',
        icon: 'fa-bus',
        iconColor: 'var(--primary-yellow)',
        title: 'Bus Breakdown Alert',
        text: 'BUS-003 reported engine issues near Downtown area. Maintenance team dispatched.',
        time: '5 min ago',
        unread: true
    },
    {
        id: 2,
        type: 'feedback',
        icon: 'fa-comment',
        iconColor: '#60a5fa',
        title: 'New Feedback Received',
        text: 'Sarah Johnson left a 5-star review for Route 42 driver.',
        time: '12 min ago',
        unread: true
    },
    {
        id: 3,
        type: 'schedule',
        icon: 'fa-clock',
        iconColor: '#f59e0b',
        title: 'Schedule Delay',
        text: 'Airport Express route delayed by 15 minutes due to traffic.',
        time: '1 hour ago',
        unread: true
    },
    {
        id: 4,
        type: 'account',
        icon: 'fa-user-plus',
        iconColor: '#34d399',
        title: 'New Account Created',
        text: 'Mike Torres joined as Driver for Route 15.',
        time: '2 hours ago',
        unread: false
    },
    {
        id: 5,
        type: 'system',
        icon: 'fa-cog',
        iconColor: '#a78bfa',
        title: 'System Update Completed',
        text: 'Scheduled maintenance completed successfully. All systems operational.',
        time: 'Yesterday',
        unread: false
    }
];

let currentFilter = 'all';

function initNotifications() {
    document.querySelectorAll('.notification-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.notification-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderNotificationsList(this.dataset.filter);
        });
    });
    
    const viewAllBtn = document.getElementById('viewAllBtn');
    if (viewAllBtn) viewAllBtn.addEventListener('click', handleViewAllClick);
    
    if (window.location.hash === '#notifications') setTimeout(initNotificationsPage, 0);
    
    const searchInput = document.getElementById('notificationSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const filtered = notificationsData.filter(n => 
                n.title.toLowerCase().includes(searchTerm) || 
                n.text.toLowerCase().includes(searchTerm)
            );
            
            const container = document.getElementById('notificationsFullList');
            if (container) {
                if (filtered.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-search"></i>
                            <h3>No results found</h3>
                            <p>Try a different search term</p>
                        </div>
                    `;
                } else {
                    container.innerHTML = filtered.map(notif => `
                        <div class="notification-full-item ${notif.unread ? 'unread' : ''}" data-id="${notif.id}">
                            <div class="notification-icon" style="color: ${notif.iconColor}">
                                <i class="fas ${notif.icon}"></i>
                            </div>
                            <div class="notification-content">
                                <div class="notification-header-row">
                                    <p class="notification-title">${notif.title}</p>
                                    ${notif.unread ? `<span class="unread-badge"><i class="fas fa-circle"></i> Unread</span>` : ''}
                                </div>
                                <p class="notification-text">${notif.text}</p>
                                <div class="notification-meta">
                                    <span><i class="far fa-clock"></i> ${notif.time}</span>
                                </div>
                            </div>
                            <div class="notification-actions">
                                ${notif.unread ? `
                                    <button class="action-icon" onclick="markNotificationRead(${notif.id})" title="Mark as read">
                                        <i class="fas fa-check"></i>
                                    </button>
                                ` : ''}
                                <button class="action-icon delete" onclick="deleteNotification(${notif.id})" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('');
                }
            }
        });
    }
    
    updateNotificationCount();
}

function renderNotificationsList(filter = 'all') {
    const container = document.getElementById('notificationsFullList');
    if (!container) return;
    
    currentFilter = filter;
    
    let filtered = notificationsData;
    if (filter === 'unread') filtered = notificationsData.filter(n => n.unread);
    else if (filter === 'alerts') filtered = notificationsData.filter(n => ['alert', 'schedule'].includes(n.type));
    else if (filter === 'system') filtered = notificationsData.filter(n => ['system', 'account'].includes(n.type));
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell-slash"></i>
                <h3>No notifications</h3>
                <p>You're all caught up!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(notif => `
        <div class="notification-full-item ${notif.unread ? 'unread' : ''}" data-id="${notif.id}">
            <div class="notification-icon" style="color: ${notif.iconColor}">
                <i class="fas ${notif.icon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-header-row">
                    <p class="notification-title">${notif.title}</p>
                    ${notif.unread ? `<span class="unread-badge"><i class="fas fa-circle"></i> Unread</span>` : ''}
                </div>
                <p class="notification-text">${notif.text}</p>
                <div class="notification-meta">
                    <span><i class="far fa-clock"></i> ${notif.time}</span>
                </div>
            </div>
            <div class="notification-actions">
                ${notif.unread ? `
                    <button class="action-icon" onclick="markNotificationRead(${notif.id})" title="Mark as read">
                        <i class="fas fa-check"></i>
                    </button>
                ` : ''}
                <button class="action-icon delete" onclick="deleteNotification(${notif.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function markNotificationRead(id) {
    const notifIndex = notificationsData.findIndex(n => n.id === id);
    if (notifIndex !== -1) {
        notificationsData[notifIndex].unread = false;
        renderNotificationsList(currentFilter);
        updateNotificationCount();
    }
}

function deleteNotification(id) {
    notificationsData = notificationsData.filter(n => n.id !== id);
    renderNotificationsList(currentFilter);
    updateNotificationCount();
}

function markAllRead() {
    notificationsData.forEach(n => n.unread = false);
    renderNotificationsList(currentFilter);
    updateNotificationCount();
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) dropdown.classList.remove('active');
}

function clearAllNotifications() {
    if (confirm('Are you sure you want to clear all notifications?')) {
        notificationsData = [];
        renderNotificationsList(currentFilter);
        updateNotificationCount();
    }
}

function updateNotificationCount() {
    const unreadCount = notificationsData.filter(n => n.unread).length;
    const headerBadge = document.getElementById('notificationCount');
    if (headerBadge) {
        headerBadge.textContent = unreadCount;
        headerBadge.style.display = unreadCount === 0 ? 'none' : 'flex';
    }
    const countText = document.getElementById('notificationCountText');
    if (countText) countText.textContent = unreadCount > 0 ? `${unreadCount} new` : 'No new';
}

function handleViewAllClick(e) {
    if (e) e.preventDefault();
    navigateToPage('notifications');
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) dropdown.classList.remove('active');
    setTimeout(() => initNotificationsPage(), 100);
}

function initNotificationsPage() {
    document.querySelectorAll('.notification-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    const allTab = document.querySelector('.notification-tabs .tab-btn[data-filter="all"]');
    if (allTab) allTab.classList.add('active');
    renderNotificationsList('all');
}

function loadMoreNotifications() {
    console.log('Load more notifications...');
}

// Initialize custom dropdowns
function initCustomSelects() {
    document.querySelectorAll('.modal select.form-input').forEach(select => {
        if (select.parentElement.classList.contains('custom-select-wrapper')) return;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select-wrapper';
        
        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';
        trigger.textContent = select.options[select.selectedIndex]?.text || 'Select...';
        
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'custom-select-options';
        
        Array.from(select.options).forEach((option, index) => {
            const optDiv = document.createElement('div');
            optDiv.className = 'custom-select-option';
            optDiv.textContent = option.text;
            optDiv.dataset.value = option.value;
            if (option.selected) optDiv.classList.add('selected');
            
            optDiv.addEventListener('click', () => {
                select.value = option.value;
                trigger.textContent = option.text;
                optionsContainer.querySelectorAll('.custom-select-option').forEach(opt => opt.classList.remove('selected'));
                optDiv.classList.add('selected');
                optionsContainer.classList.remove('active');
                trigger.classList.remove('active');
                select.dispatchEvent(new Event('change'));
            });
            
            optionsContainer.appendChild(optDiv);
        });
        
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-select-options.active').forEach(opt => {
                if (opt !== optionsContainer) {
                    opt.classList.remove('active');
                    opt.previousElementSibling.classList.remove('active');
                }
            });
            optionsContainer.classList.toggle('active');
            trigger.classList.toggle('active');
        });
        
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                optionsContainer.classList.remove('active');
                trigger.classList.remove('active');
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                optionsContainer.classList.remove('active');
                trigger.classList.remove('active');
            }
        });
        
        select.parentNode.insertBefore(wrapper, select);
        wrapper.appendChild(select);
        wrapper.appendChild(trigger);
        wrapper.appendChild(optionsContainer);
        select.classList.add('hidden-select');
        
        select.addEventListener('change', () => {
            trigger.textContent = select.options[select.selectedIndex].text;
            optionsContainer.querySelectorAll('.custom-select-option').forEach((opt, idx) => {
                opt.classList.toggle('selected', idx === select.selectedIndex);
            });
        });
    });
}

document.addEventListener('DOMContentLoaded', initCustomSelects);

const originalOpenBusModal = window.openBusModal;
window.openBusModal = function(...args) {
    if (originalOpenBusModal) originalOpenBusModal.apply(this, args);
    setTimeout(initCustomSelects, 100);
};

const originalOpenScheduleModal = window.openScheduleModal;
window.openScheduleModal = function(...args) {
    if (originalOpenScheduleModal) originalOpenScheduleModal.apply(this, args);
    setTimeout(initCustomSelects, 100);
};

const originalOpenAccountModal = window.openAccountModal;
window.openAccountModal = function(...args) {
    if (originalOpenAccountModal) originalOpenAccountModal.apply(this, args);
    setTimeout(initCustomSelects, 100);
};