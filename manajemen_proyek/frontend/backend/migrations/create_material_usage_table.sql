-- Migration: Create material_usage table
-- Database: PostgreSQL
-- Description: Table for tracking material consumption and linking to daily reports

-- Create material_usage table
CREATE TABLE IF NOT EXISTS material_usage (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    daily_report_id INTEGER,
    quantity DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(15, 2) NOT NULL DEFAULT 0,
    usage_date DATE NOT NULL,
    used_by INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_material_usage_project 
        FOREIGN KEY (project_id) 
        REFERENCES projects(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_material_usage_material 
        FOREIGN KEY (material_id) 
        REFERENCES materials(id) 
        ON DELETE RESTRICT,
    
    CONSTRAINT fk_material_usage_daily_report 
        FOREIGN KEY (daily_report_id) 
        REFERENCES daily_reports(id) 
        ON DELETE SET NULL,
    
    CONSTRAINT fk_material_usage_user 
        FOREIGN KEY (used_by) 
        REFERENCES users(id) 
        ON DELETE RESTRICT,
    
    -- Check constraints
    CONSTRAINT chk_quantity_positive 
        CHECK (quantity > 0),
    
    CONSTRAINT chk_cost_non_negative 
        CHECK (cost >= 0)
);

-- Create indexes for better query performance
CREATE INDEX idx_material_usage_project_id ON material_usage(project_id);
CREATE INDEX idx_material_usage_material_id ON material_usage(material_id);
CREATE INDEX idx_material_usage_daily_report_id ON material_usage(daily_report_id);
CREATE INDEX idx_material_usage_usage_date ON material_usage(usage_date);
CREATE INDEX idx_material_usage_used_by ON material_usage(used_by);

-- Create composite index for common queries
CREATE INDEX idx_material_usage_project_date ON material_usage(project_id, usage_date);
CREATE INDEX idx_material_usage_material_date ON material_usage(material_id, usage_date);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_material_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_material_usage_updated_at
    BEFORE UPDATE ON material_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_material_usage_updated_at();

-- Create trigger function to calculate cost automatically
CREATE OR REPLACE FUNCTION calculate_material_usage_cost()
RETURNS TRIGGER AS $$
DECLARE
    unit_price DECIMAL(15, 2);
BEGIN
    -- Get unit price from materials table
    SELECT unit_price INTO unit_price
    FROM materials
    WHERE id = NEW.material_id;
    
    -- Calculate cost
    NEW.cost = NEW.quantity * unit_price;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate cost
CREATE TRIGGER trigger_calculate_material_usage_cost
    BEFORE INSERT OR UPDATE ON material_usage
    FOR EACH ROW
    EXECUTE FUNCTION calculate_material_usage_cost();

-- Create trigger function to update BOM used_qty
CREATE OR REPLACE FUNCTION update_bom_used_qty()
RETURNS TRIGGER AS $$
BEGIN
    -- Update BOM used_qty when material usage is added
    IF TG_OP = 'INSERT' THEN
        UPDATE bom
        SET 
            used_qty = used_qty + NEW.quantity,
            actual_cost = actual_cost + NEW.cost,
            remaining_qty = planned_qty - (used_qty + NEW.quantity),
            updated_at = CURRENT_TIMESTAMP
        WHERE project_id = NEW.project_id 
            AND material_id = NEW.material_id;
    
    -- Update BOM when material usage is updated
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE bom
        SET 
            used_qty = used_qty - OLD.quantity + NEW.quantity,
            actual_cost = actual_cost - OLD.cost + NEW.cost,
            remaining_qty = planned_qty - (used_qty - OLD.quantity + NEW.quantity),
            updated_at = CURRENT_TIMESTAMP
        WHERE project_id = NEW.project_id 
            AND material_id = NEW.material_id;
    
    -- Update BOM when material usage is deleted
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE bom
        SET 
            used_qty = used_qty - OLD.quantity,
            actual_cost = actual_cost - OLD.cost,
            remaining_qty = planned_qty - (used_qty - OLD.quantity),
            updated_at = CURRENT_TIMESTAMP
        WHERE project_id = OLD.project_id 
            AND material_id = OLD.material_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update BOM
CREATE TRIGGER trigger_update_bom_used_qty
    AFTER INSERT OR UPDATE OR DELETE ON material_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_bom_used_qty();

-- Create view for material usage with related data
CREATE OR REPLACE VIEW v_material_usage_details AS
SELECT 
    mu.id,
    mu.project_id,
    p.name AS project_name,
    mu.material_id,
    m.name AS material_name,
    m.code AS material_code,
    m.unit AS material_unit,
    m.unit_price AS material_unit_price,
    mu.daily_report_id,
    dr.report_date,
    dr.title AS report_title,
    mu.quantity,
    mu.cost,
    mu.usage_date,
    mu.used_by,
    u.full_name AS user_name,
    u.email AS user_email,
    mu.notes,
    mu.created_at,
    mu.updated_at
FROM material_usage mu
JOIN projects p ON mu.project_id = p.id
JOIN materials m ON mu.material_id = m.id
LEFT JOIN daily_reports dr ON mu.daily_report_id = dr.id
JOIN users u ON mu.used_by = u.id;

-- Add comments for documentation
COMMENT ON TABLE material_usage IS 'Stores material consumption records linked to projects and daily reports';
COMMENT ON COLUMN material_usage.id IS 'Primary key';
COMMENT ON COLUMN material_usage.project_id IS 'Reference to project';
COMMENT ON COLUMN material_usage.material_id IS 'Reference to material';
COMMENT ON COLUMN material_usage.daily_report_id IS 'Optional reference to daily report';
COMMENT ON COLUMN material_usage.quantity IS 'Quantity of material used';
COMMENT ON COLUMN material_usage.cost IS 'Calculated cost (quantity * unit_price)';
COMMENT ON COLUMN material_usage.usage_date IS 'Date when material was used';
COMMENT ON COLUMN material_usage.used_by IS 'User who recorded the usage';
COMMENT ON COLUMN material_usage.notes IS 'Additional notes about usage';

-- Insert sample data (optional, for testing)
-- INSERT INTO material_usage (project_id, material_id, daily_report_id, quantity, usage_date, used_by, notes)
-- VALUES 
--     (1, 1, 1, 100.50, '2025-01-15', 1, 'Foundation work - cement usage'),
--     (1, 2, 1, 50.00, '2025-01-15', 1, 'Foundation work - steel bars'),
--     (1, 3, NULL, 25.75, '2025-01-16', 2, 'Wall construction');

-- Grant permissions (adjust based on your user roles)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON material_usage TO project_manager;
-- GRANT SELECT ON material_usage TO project_viewer;
-- GRANT USAGE, SELECT ON SEQUENCE material_usage_id_seq TO project_manager;

