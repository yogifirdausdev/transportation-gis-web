# Changelog

## 0.3.0

- Added selectable icon per category
- Added `EXISTING` / `PLANNED` implementation status
- Added solid vs outlined/dashed marker styling by implementation status
- Added public and admin status filters
- Added public map legend
- Moved Leaflet zoom control to bottom-right to avoid filter overlap
- Made fiscal year optional for manual entry and bulk import
- Added optional Status column to Excel import, with blank values defaulting to Existing
- Kept backward compatibility with v0.2 Excel files
- Preserved the shared Leaflet renderer memory-leak fix from 99e1c78

## 0.2.0

- Standardized Excel import template
- Added source provenance and import batches
- Added import preview validation and row highlighting
- Added safe import rollback
- Added fiscal year
- Added 44 DKI Jakarta district master values
- Changed location photos to one photo
- Added category color editing for existing categories
- Separated public and internal data exposure
- Reworked sessions for reverse-proxy deployment
- Added Transit Teal shadcn-style UI refresh
