export const COLORS = {
    background: "#1a0033", // Very dark purple (almost black)
    land: "#5a189a",       // Brighter Purple
    water: "#050011",      // Dark water
    roads: "#9d4edd",      // Vivid purple
    text: "#e0aaff",       // Light lilac
};

export const FOG_CONFIG = {
    range: [0.5, 10],
    color: "#1a0033",
    "high-color": "#5a189a",
    "space-color": "#050011",
    "star-intensity": 0.35,
};

export const STANDARD_STYLE_URL = "mapbox://styles/mapbox/standard";

export const customMapStyle: any = {
    version: 8,
    name: "Geogram Custom",
    sprite: "mapbox://sprites/mapbox/dark-v9",
    glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
    sources: {
        "mapbox-streets": {
            type: "vector",
            url: "mapbox://mapbox.mapbox-streets-v8"
        }
    },
    layers: [
        {
            id: "background",
            type: "background",
            paint: { "background-color": COLORS.background }
        },
        {
            id: "landuse",
            source: "mapbox-streets",
            "source-layer": "landuse",
            type: "fill",
            paint: { "fill-color": COLORS.land, "fill-opacity": 0.8 }
        },
        {
            id: "water",
            source: "mapbox-streets",
            "source-layer": "water",
            type: "fill",
            paint: { "fill-color": COLORS.water }
        },
        {
            id: "road",
            source: "mapbox-streets",
            "source-layer": "road",
            type: "line",
            layout: { "visibility": "visible" },
            paint: {
                "line-color": COLORS.roads,
                "line-width": [
                    "interpolate", ["linear"], ["zoom"],
                    2, 0.1,
                    6, 0.4,
                    10, 0.6,
                    12, 0.8,
                    13, 1.0,
                    15, 1.5,
                    18, 5
                ]
            }
        },
        // --- PHYSICAL INFRASTRUCTURE: Aeroways (Airports) ---
        {
            id: "aeroway-area",
            source: "mapbox-streets",
            "source-layer": "aeroway",
            type: "fill",
            minzoom: 10,
            layout: { "visibility": "visible" },
            paint: {
                "fill-color": COLORS.roads,
                "fill-opacity": 0.5,
            }
        },
        {
            id: "aeroway-line",
            source: "mapbox-streets",
            "source-layer": "aeroway",
            type: "line",
            minzoom: 10,
            layout: { "visibility": "visible" },
            paint: {
                "line-color": COLORS.roads,
                "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1, 16, 6],
                "line-opacity": 1,
            }
        },
        // --- PHYSICAL INFRASTRUCTURE: Transit (Railways) ---
        {
            id: "transit-railway",
            source: "mapbox-streets",
            "source-layer": "road",
            type: "line",
            minzoom: 10,
            layout: { "visibility": "none" },
            paint: {
                "line-color": COLORS.roads,
                "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.5, 15, 2],
                "line-opacity": 0.5,
                "line-dasharray": [2, 1],
            },
            filter: ["in", ["get", "class"], ["literal", ["rail", "major_rail", "minor_rail"]]]
        },
        // 3D Buildings
        {
            id: "building-3d",
            source: "mapbox-streets",
            "source-layer": "building",
            type: "fill-extrusion",
            minzoom: 13,
            layout: { "visibility": "none" },
            paint: {
                "fill-extrusion-vertical-gradient": true,
                "fill-extrusion-color": [
                    "interpolate", ["linear"], ["get", "height"],
                    0, "#3c1f6b",
                    15, "#6a3aaa",
                    40, "#9d4edd",
                    80, "#c77dff",
                    150, "#e0aaff"
                ],
                "fill-extrusion-height": [
                    "interpolate", ["linear"], ["zoom"],
                    13, 0,
                    13.5, ["get", "height"]
                ],
                "fill-extrusion-base": [
                    "interpolate", ["linear"], ["zoom"],
                    13, 0,
                    13.5, ["get", "min_height"]
                ]
            }
        },
        // Water Outline (Coastline) - Enhanced
        {
            id: "water-outline",
            source: "mapbox-streets",
            "source-layer": "water",
            type: "line",
            paint: {
                "line-color": COLORS.text, // Match admin/country border color
                "line-width": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    2, 0.2,   // Thinner start
                    6, 0.4,   // Sleek at mid-zoom
                    12, 1.5   // Defined when close
                ],
                "line-opacity": 0.6, // Slightly softer
            },
        },
        // Admin Boundaries - Countries (admin_level <= 2)
        {
            id: "admin-country",
            source: "mapbox-streets",
            "source-layer": "admin",
            type: "line",
            paint: {
                "line-color": COLORS.text,
                "line-width": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    2, 0.4,   // Thinner global view
                    6, 0.6,   // Professional mid-view
                    12, 1.2   // Clear local view
                ],
                "line-opacity": 0.4, // Softer integration
            },
            filter: ["<=", ["get", "admin_level"], 2]
        },
        // Admin Boundaries - Subnational (States/Districts, admin_level > 2)
        {
            id: "admin-subnational",
            source: "mapbox-streets",
            "source-layer": "admin",
            type: "line",
            minzoom: 7, // Hide until regional view to prevent clutter at zoom 4-6
            paint: {
                "line-color": COLORS.text,
                "line-width": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    7, 0.05,
                    12, 0.1,
                    15, 0.15
                ],
                "line-opacity": 0.04,
            },
            filter: [">", ["get", "admin_level"], 2]
        },
        // --- ADMINISTRATIVE: Country Labels ---
        {
            id: "country-label",
            source: "mapbox-streets",
            "source-layer": "place_label",
            type: "symbol",
            maxzoom: 10,
            filter: ["==", ["get", "class"], "country"],
            layout: {
                "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
                "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                "text-size": [
                    "interpolate", ["linear"], ["zoom"],
                    1, 10,
                    5, 14,
                    8, 22
                ],
                "text-transform": "uppercase",
                "text-letter-spacing": 0.1,
                "text-max-width": 8
            },
            paint: {
                "text-color": COLORS.text,
                "text-halo-color": COLORS.background,
                "text-halo-width": 1.5,
                "text-opacity": ["interpolate", ["linear"], ["zoom"], 8, 1, 10, 0]
            }
        },
        // --- TEXT LABELS (NO ICONS) for Place Names ---
        // Tier 1: Major Cities (Global View)
        {
            id: "place-city-major",
            source: "mapbox-streets",
            "source-layer": "place_label",
            type: "symbol",
            minzoom: 4,
            filter: ["all", ["==", ["get", "class"], "city"], ["<=", ["get", "rank"], 3]],
            layout: {
                "visibility": "none",
                "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
                "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                "text-size": ["interpolate", ["linear"], ["zoom"], 4, 12, 10, 16],
                "text-anchor": "center"
            },
            paint: { "text-color": COLORS.text }
        },
        // Tier 2: Towns & Small Cities (Regional View)
        {
            id: "place-town",
            source: "mapbox-streets",
            "source-layer": "place_label",
            type: "symbol",
            minzoom: 8,
            filter: ["in", ["get", "class"], ["literal", ["town", "city"]]],
            layout: {
                "visibility": "none",
                "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
                "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                "text-size": ["interpolate", ["linear"], ["zoom"], 8, 10, 12, 14],
                "text-anchor": "center"
            },
            paint: { "text-color": COLORS.text }
        },
        // Tier 3: Neighborhoods, Suburbs, Villages (Local View)
        {
            id: "place-neighborhood",
            source: "mapbox-streets",
            "source-layer": "place_label",
            type: "symbol",
            minzoom: 11,
            filter: ["in", ["get", "class"], ["literal", ["village", "suburb", "neighbourhood", "hamlet"]]],
            layout: {
                "visibility": "none",
                "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
                "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                "text-size": ["interpolate", ["linear"], ["zoom"], 11, 10, 16, 14],
                "text-anchor": "center"
            },
            paint: { "text-color": COLORS.text, "text-opacity": 0.8 }
        },
        // POI Labels - Airports
        {
            id: "airport-label",
            source: "mapbox-streets",
            "source-layer": "airport_label",
            type: "symbol",
            minzoom: 8,
            layout: {
                "visibility": "none",
                "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
                "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                "text-size": ["interpolate", ["linear"], ["zoom"], 8, 12, 14, 15],
                "icon-image": ["concat", ["get", "maki"], "-15"],
                "icon-size": 1.2,
                "text-offset": [0, 1.2],
                "text-anchor": "top"
            },
            paint: {
                "text-color": COLORS.text,
                "icon-color": COLORS.text,
                "icon-halo-color": COLORS.background,
                "icon-halo-width": 1
            }
        },
        // POI Labels - Transit Stops (Metro, Rail, etc.)
        {
            id: "transit-stop-label",
            source: "mapbox-streets",
            "source-layer": "transit_stop_label",
            type: "symbol",
            minzoom: 11, // Show a bit earlier
            layout: {
                "visibility": "none",
                "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
                "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                "text-size": ["interpolate", ["linear"], ["zoom"], 12, 10, 16, 13],
                "icon-image": [
                    "coalesce",
                    ["concat", ["get", "maki"], "-15"],
                    "rail-15" // Fallback to generic rail icon
                ],
                "icon-size": 1,
                "text-offset": [0, 1.2],
                "text-anchor": "top",
                "icon-allow-overlap": true // Ensure icons show up even in crowded areas
            },
            paint: {
                "text-color": COLORS.text,
                "icon-color": COLORS.text,
                "icon-halo-color": COLORS.background,
                "icon-halo-width": 1
            }
        },
        // POI Labels - General (Cafes, Restaurants, etc.)
        {
            id: "poi-label-general",
            source: "mapbox-streets",
            "source-layer": "poi_label",
            type: "symbol",
            minzoom: 15,
            layout: {
                "visibility": "none",
                "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
                "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                "text-size": ["interpolate", ["linear"], ["zoom"], 15, 10, 18, 13],
                "icon-image": ["concat", ["get", "maki"], "-15"],
                "icon-size": 1,
                "text-offset": [0, 1.2],
                "text-anchor": "top",

            },
            paint: {
                "text-color": COLORS.text,
                "text-opacity": 0.8,
                "icon-color": COLORS.text,
                "icon-halo-color": COLORS.background,
                "icon-halo-width": 1
            }
        }
    ]
};
