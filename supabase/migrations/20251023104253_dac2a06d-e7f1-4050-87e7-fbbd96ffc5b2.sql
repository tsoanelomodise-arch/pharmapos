-- Update RLS policies on user_roles to allow both admins and owners to manage roles

-- Drop existing policies
DROP POLICY IF EXISTS "Only owners can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Only owners can update roles" ON user_roles;
DROP POLICY IF EXISTS "Only owners can delete roles" ON user_roles;

-- Create new policies that allow both admins and owners
CREATE POLICY "Admins and owners can insert roles"
ON user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner')
);

CREATE POLICY "Admins and owners can update roles"
ON user_roles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner')
);

CREATE POLICY "Admins and owners can delete roles"
ON user_roles
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'owner')
);

-- Also allow admins to view all roles (not just owners)
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;

CREATE POLICY "Users can view their own roles"
ON user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'owner')
);