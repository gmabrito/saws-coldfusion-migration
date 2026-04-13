# Migration Log - Utility Maps Module (BRD Approach)

## Approach
BRD-driven migration -- functionality derived from department name "Utility Maps" (infrastructure map viewing and management)

## Decisions Made
- Two tables: Maps (main) and MapCategories (lookup) in `utilitymaps` schema
- MapCategories seeded with six default categories: Water Distribution, Sewer Collection, Service Areas, Infrastructure, Construction, Environmental
- Map listing uses card-based grid layout instead of table for better visual browsing
- Map file storage is URL-based (FileUrl field) -- assumes maps hosted on internal file server
- FileType field tracks format (PDF, GIS, CAD, Image, Shapefile) for display purposes
- Admin-only access for create/edit/delete operations; all authenticated users can view
- Categories endpoint added (`GET /api/maps/categories`) for dynamic filter dropdowns
- Search supports title and description text matching via SQL LIKE
- Area field is free-text to accommodate various geographic naming conventions
- Hard delete for map removal (unlike print-shop soft delete) since maps are metadata entries

## Requirements Covered
- Map listing with category filter and text search
- Map detail view with full metadata display
- Admin form for creating and editing map entries
- Map deletion (admin only)
- Category-based organization with seeded defaults
- File type tracking for different map formats

## Known Gaps
- No actual map rendering or GIS viewer integration (displays metadata and file link only)
- No map layer management (layers mentioned in spec but not implemented as separate entities)
- No file upload capability -- maps referenced by URL only
- No map versioning or revision history
- No spatial/geographic search (area is text-based only)
- No thumbnail/preview generation for map files

## Notes
- Uses `utilitymaps` schema per project convention
- Minimal BRD content -- all functionality derived from "Utility Maps" department name
- Card-based UI chosen over table to better suit visual map browsing experience
- MapCategories table seeded with INSERT in schema script for out-of-box usability
