-- Upgrade tsoanelomodise@gmail.com to owner
UPDATE public.user_roles 
SET role = 'owner'
WHERE user_id = '7e6c9eb7-c5b2-46a0-a5a2-03d84a044162';

-- Upgrade phumi.skos@gmail.com to owner
UPDATE public.user_roles 
SET role = 'owner'
WHERE user_id = 'a7870d7b-2978-4dce-8a29-07526185a459';