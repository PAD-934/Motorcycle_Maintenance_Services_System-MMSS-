USE motofix;

INSERT INTO services
  (service_code, name, category, description, price, estimated_hours, duration_label, is_active)
VALUES
  ('S1', 'Basic Oil Change', 'Maintenance', 'Engine oil + filter replacement', 350.00, 0.75, '45 min', TRUE),
  ('S2', 'Full Tune-Up', 'Maintenance', 'Spark plugs, air filter, carburetor clean, chain adj.', 1200.00, 2.00, '2.0 hrs', TRUE),
  ('S3', 'Brake System Service', 'Safety', 'Brake pads, fluid flush, rotor inspection', 800.00, 1.50, '1.5 hrs', TRUE),
  ('S4', 'Tire Replacement', 'Tires', 'Front or rear tire mount & balance', 600.00, 1.00, '1.0 hrs', TRUE),
  ('S5', 'Engine Overhaul', 'Engine', 'Full engine rebuild, gaskets, valves', 8500.00, 8.00, '8.0 hrs', TRUE),
  ('S6', 'Electrical Diagnostics', 'Electrical', 'Battery, charging system, wiring inspection', 500.00, 1.00, '1.0 hrs', TRUE),
  ('S7', 'Suspension Setup', 'Suspension', 'Fork oil, rear shock, alignment', 1500.00, 2.50, '2.5 hrs', TRUE),
  ('S8', 'Custom Paint Job', 'Customization', 'Full custom paint with clear coat', 4500.00, 48.00, '48.0 hrs', TRUE),
  ('S9', 'Performance Exhaust Install', 'Customization', 'Aftermarket exhaust system fitting', 2200.00, 3.00, '3.0 hrs', TRUE),
  ('S10', 'Chain & Sprocket Kit', 'Drivetrain', 'Chain + front/rear sprocket replacement', 950.00, 1.50, '1.5 hrs', TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  description = VALUES(description),
  price = VALUES(price),
  estimated_hours = VALUES(estimated_hours),
  duration_label = VALUES(duration_label),
  is_active = VALUES(is_active);

INSERT INTO parts
  (sku, name, brand, category, stock_quantity, max_stock_quantity, unit_price, is_active)
VALUES
  ('OIL-10W40-1L', 'Engine Oil 10W-40 (1L)', 'Motul', 'Fluids', 48, 60, 180.00, TRUE),
  ('FLT-OIL-PCX', 'Oil Filter — Honda PCX', 'Honda Genuine', 'Filters', 22, 60, 95.00, TRUE),
  ('SPK-CR8E', 'Spark Plug CR8E', 'NGK', 'Ignition', 64, 70, 75.00, TRUE),
  ('FLT-AIR-NMAX', 'Air Filter — Yamaha NMAX', 'Yamaha Genuine', 'Filters', 18, 60, 220.00, TRUE),
  ('BRK-PAD-FR', 'Brake Pad Set — Front', 'EBC', 'Brakes', 30, 60, 450.00, TRUE),
  ('FLD-DOT4-500', 'Brake Fluid DOT4 (500ml)', 'Brembo', 'Fluids', 25, 60, 130.00, TRUE),
  ('CHN-428-110', 'Chain Kit 428 (110L)', 'DID', 'Drivetrain', 12, 60, 680.00, TRUE),
  ('SPR-FR-15T', 'Front Sprocket 15T', 'Renthal', 'Drivetrain', 20, 60, 240.00, TRUE),
  ('SPR-RR-42T', 'Rear Sprocket 42T', 'Renthal', 'Drivetrain', 15, 60, 380.00, TRUE),
  ('OIL-FRK-15W', 'Fork Oil 15W (1L)', 'Motul', 'Fluids', 16, 60, 210.00, TRUE),
  ('CARB-JET-UNI', 'Carburetor Jet Kit', 'Universal', 'Engine', 8, 60, 350.00, TRUE),
  ('BAT-12V-5AH', 'Battery 12V 5Ah', 'Yuasa', 'Electrical', 10, 60, 850.00, TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  brand = VALUES(brand),
  category = VALUES(category),
  stock_quantity = VALUES(stock_quantity),
  max_stock_quantity = VALUES(max_stock_quantity),
  unit_price = VALUES(unit_price),
  is_active = VALUES(is_active);