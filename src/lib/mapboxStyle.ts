// Brand Colors
const COLORS = {
    background: "#1a0033", // Very dark purple (almost black)
    land: "#240046",       // Dark purple
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
                "line-width": 1,
                "line-opacity": 0.3,
            },
        },
        // Admin Boundaries
        {
            id: "admin",
            source: "mapbox-streets",
            "source-layer": "admin",
            type: "line",
            paint: {
                "line-color": COLORS.text,
                "line-width": 0.5,
                "line-opacity": 0.2,
            },
        },
        // 3D Buildings
        {
            id: "building-3d",
            source: "mapbox-streets",
            "source-layer": "building",
            type: "fill-extrusion",
            minzoom: 14,
            paint: {
                "fill-extrusion-color": COLORS.land,
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
                "fill-extrusion-opacity": 0.8,
            },
        },
        // Place Labels (Cities) - Minimal
        {
            id: "place-label",
            source: "mapbox-streets",
            "source-layer": "place_label",
            type: "symbol",
            layout: {
                "text-field": ["get", "name_en"],
                "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                "text-size": 12,
            },
            paint: {
                "text-color": COLORS.text,
                "text-halo-color": COLORS.background,
                "text-halo-width": 1,
            },
            filter: ["==", "class", "settlement"], // Only show settlements
        },
    ],
};
