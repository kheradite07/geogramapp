// Brand Colors
const COLORS = {
    background: "#1a0033", // Very dark purple (almost black)
    land: "#5a189a",       // Much brighter Purple (was #3c096c)
    water: "#050011",      // Match background
    roads: "#9d4edd",      // Bright vivid purple for high contrast
    text: "#e0aaff",       // Light lilac
};

export const customMapStyle = {
    version: 8,
    name: "Geogram Minimal",
    glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
    metadata: {},
    sources: {
        "mapbox-streets": {
            type: "vector",
            url: "mapbox://mapbox.mapbox-streets-v8",
        },
    },
    layers: [
        // Background
        {
            id: "background",
            type: "background",
            paint: {
                "background-color": COLORS.background,
            },
        },
        // Water
        {
            id: "water",
            source: "mapbox-streets",
            "source-layer": "water",
            type: "fill",
            paint: {
                "fill-color": COLORS.water,
            },
        },
        // Landuse (Parks, etc - simplified)
        {
            id: "landuse",
            source: "mapbox-streets",
            "source-layer": "landuse",
            type: "fill",
            paint: {
                "fill-color": COLORS.land,
                "fill-opacity": 0.5,
            },
        },
        // Roads (Lines)
        {
            id: "road",
            source: "mapbox-streets",
            "source-layer": "road",
            type: "line",
            paint: {
                "line-color": COLORS.roads,
                "line-width": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    5,
                    ["match", ["get", "class"],
                        ["motorway", "trunk"], 0.5,
                        0.1 // barely visible
                    ],
                    8,
                    ["match", ["get", "class"],
                        ["motorway", "trunk"], 1.5,
                        ["primary", "secondary"], 0.5,
                        0.1
                    ],
                    10,
                    ["match", ["get", "class"],
                        ["motorway", "trunk"], 2,
                        ["primary", "secondary"], 1.5,
                        0.5 // streets/others
                    ],
                    14,
                    ["match", ["get", "class"],
                        ["motorway", "trunk"], 6,
                        ["primary", "secondary"], 4,
                        2 // streets
                    ],
                    18,
                    ["match", ["get", "class"],
                        ["motorway", "trunk"], 24,
                        ["primary", "secondary"], 16,
                        10 // streets
                    ]
                ],
                "line-opacity": [
                    "match", ["get", "class"],
                    ["path", "pedestrian"], 0.4,
                    0.6
                ],
            },
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
                    2, 0.5,
                    5, 1,
                    10, 2
                ],
                "line-opacity": 0.8, // More visible
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
                    2, 0.8,
                    5, 1.2,
                    10, 1.8
                ],
                "line-opacity": 0.5,
            },
            filter: ["<=", ["get", "admin_level"], 2]
        },
        // Admin Boundaries - Subnational (States/Districts, admin_level > 2)
        {
            id: "admin-subnational",
            source: "mapbox-streets",
            "source-layer": "admin",
            type: "line",
            paint: {
                "line-color": COLORS.text,
                "line-width": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    2, 0,
                    5, 0.05,
                    10, 0.1,
                    15, 0.15
                ],
                "line-opacity": 0.04,
            },
            filter: [">", ["get", "admin_level"], 2]
        },
        // 3D Buildings
        {
            id: "building-3d",
            source: "mapbox-streets",
            "source-layer": "building",
            type: "fill-extrusion",
            minzoom: 14,
            paint: {
                "fill-extrusion-color": [
                    "interpolate",
                    ["linear"],
                    ["get", "height"],
                    0, COLORS.land,
                    20, "#5a189a", // Brighter bump
                    50, COLORS.roads,
                    100, COLORS.text
                ],
                "fill-extrusion-height": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    14,
                    0,
                    14.05,
                    ["get", "height"]
                ],
                "fill-extrusion-base": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    14,
                    0,
                    14.05,
                    ["get", "min_height"]
                ],
                "fill-extrusion-opacity": 0.9,
                "fill-extrusion-ambient-occlusion-intensity": 0.4,
            },
        },
        // Country Labels (Always visible at low zoom)
        {
            id: "country-label",
            source: "mapbox-streets",
            "source-layer": "place_label",
            type: "symbol",
            minzoom: 1,
            maxzoom: 10,
            layout: {
                "text-field": ["get", "name_en"],
                "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                "text-size": [
                    "interpolate", ["linear"], ["zoom"],
                    2, 12,
                    8, 16
                ],
                "text-transform": "uppercase",
                "text-letter-spacing": 0.1,
            },
            paint: {
                "text-color": COLORS.text,
                "text-halo-color": COLORS.background,
                "text-halo-width": 2,
                "text-opacity": 0.8,
            },
            filter: ["==", "class", "country"],
        },
        // Settlement Labels (Cities - Zoom dependent)
        {
            id: "settlement-label",
            source: "mapbox-streets",
            "source-layer": "place_label",
            type: "symbol",
            minzoom: 5, // Hide cities until zoom 5
            layout: {
                "text-field": ["get", "name_en"],
                "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                "text-size": [
                    "interpolate", ["linear"], ["zoom"],
                    5, 10,
                    12, 14
                ],
            },
            paint: {
                "text-color": COLORS.text,
                "text-halo-color": COLORS.background,
                "text-halo-width": 1.5,
            },
            filter: ["==", "class", "settlement"],
        },
    ],
};
