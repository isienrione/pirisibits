// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "ChronowalkOfflineMaps",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "ChronowalkOfflineMaps",
            targets: ["ChronoWalkOfflineMapsPlugin"]
        )
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0"),
        // Mapbox Maps SDK for iOS — OfflineManager + TileStore.
        // Pin exact so Phase 1 reports a resolved version; bump deliberately later.
        .package(url: "https://github.com/mapbox/mapbox-maps-ios.git", exact: "11.27.1"),
        // Explicit Turf for Polygon geometry (same version Mapbox Maps 11.27.1 pins).
        .package(url: "https://github.com/mapbox/turf-swift.git", exact: "4.0.0")
    ],
    targets: [
        .target(
            name: "ChronoWalkOfflineMapsPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "MapboxMaps", package: "mapbox-maps-ios"),
                .product(name: "Turf", package: "turf-swift")
            ],
            path: "ios/Sources/ChronoWalkOfflineMapsPlugin"
        )
    ]
)
