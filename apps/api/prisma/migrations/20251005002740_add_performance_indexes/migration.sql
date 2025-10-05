-- CreateIndex
CREATE INDEX "community_admins_user_id_idx" ON "community_admins"("user_id");

-- CreateIndex
CREATE INDEX "community_admins_community_id_idx" ON "community_admins"("community_id");

-- CreateIndex
CREATE INDEX "user_roles_user_id_idx" ON "user_roles"("user_id");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "user_units_user_id_idx" ON "user_units"("user_id");

-- CreateIndex
CREATE INDEX "user_units_unit_id_idx" ON "user_units"("unit_id");

-- CreateIndex
CREATE INDEX "user_units_status_idx" ON "user_units"("status");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "users_organization_id_status_idx" ON "users"("organization_id", "status");

-- CreateIndex
CREATE INDEX "users_organization_id_created_at_idx" ON "users"("organization_id", "created_at");
