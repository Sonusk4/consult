-- Insert credit packages
INSERT INTO "CreditPackage" (amount, bonus, is_active, created_at) VALUES
(500, 50, true, NOW()),
(1000, 120, true, NOW()),
(2000, 300, true, NOW()),
(5000, 800, true, NOW());

-- This will add the credit packages: ₹500+₹50, ₹1000+₹120, ₹2000+₹300, ₹5000+₹800
