CREATE TABLE IF NOT EXISTS harmony_reward_policies (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 code varchar(80) NOT NULL UNIQUE,
 points_per_omr integer NOT NULL CHECK(points_per_omr>0 AND points_per_omr<=1000),
 welcome_bonus_points integer NOT NULL DEFAULT 0 CHECK(welcome_bonus_points>=0),
 is_active boolean NOT NULL DEFAULT false,
 effective_from timestamptz NOT NULL DEFAULT now(),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS harmony_reward_policies_one_active ON harmony_reward_policies(is_active) WHERE is_active;
ALTER TABLE harmony_reward_policies ENABLE ROW LEVEL SECURITY;
INSERT INTO harmony_reward_policies(code,points_per_omr,welcome_bonus_points,is_active)
VALUES('HARMONY_V1',10,20,true) ON CONFLICT(code) DO UPDATE SET points_per_omr=EXCLUDED.points_per_omr,welcome_bonus_points=EXCLUDED.welcome_bonus_points,is_active=true,updated_at=now();
INSERT INTO rewards(code,name,points_cost,is_active) VALUES
 ('HARMONY_DRINK','Harmony Drink Reward',100,true),
 ('HARMONY_SIGNATURE','Harmony Signature / Matcha Reward',150,true),
 ('HARMONY_DESSERT','Harmony Dessert Reward',200,true),
 ('HARMONY_PREMIUM','Harmony Premium Reward',300,true)
ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,points_cost=EXCLUDED.points_cost,is_active=true;