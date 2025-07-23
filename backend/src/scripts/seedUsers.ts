import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Gym } from "../models/Gym";
import { UserRole } from "../models/common/enums";

export const seedUsers = async () => {
	console.log("Seeding users...");

	await User.deleteMany({});

	const hashedSuperAdminPassword = await bcrypt.hash("superadmin123", 10);
	const hashedGymOwnerPassword = await bcrypt.hash("gymowner123", 10);
	const hashedClientPassword = await bcrypt.hash("client123", 10);

	const superAdmin = await User.create({
		username: "superadmin",
		email: "superadmin@example.com",
		password: hashedSuperAdminPassword,
		firstName: "Super",
		lastName: "Admin",
		role: UserRole.SUPER_ADMIN,
		isActive: true,
	});

	const gymOwner = await User.create({
		username: "gymowner",
		email: "gymowner@example.com",
		password: hashedGymOwnerPassword,
		firstName: "Gym",
		lastName: "Owner",
		role: UserRole.GYM_OWNER,
		isActive: true,
	});

	const client = await User.create({
		username: "clientuser",
		email: "client@example.com",
		password: hashedClientPassword,
		firstName: "Client",
		lastName: "User",
		role: UserRole.CLIENT,
		isActive: true,
	});

	const client2 = await User.create({
		username: "clientuser2",
		email: "client2@example.com",
		password: hashedClientPassword,
		firstName: "Client2",
		lastName: "User2",
		role: UserRole.CLIENT,
		isActive: true,
	});

	const client3 = await User.create({
		username: "marie_durant",
		email: "marie@example.com",
		password: hashedClientPassword,
		firstName: "Marie",
		lastName: "Durant",
		role: UserRole.CLIENT,
		isActive: true,
	});

	console.log("Users seeded:");
	console.log(`   - SuperAdmin: ${superAdmin.username} (${superAdmin.email})`);
	console.log(`   - GymOwner: ${gymOwner.username} (${gymOwner.email})`);
	console.log(`   - Client: ${client.username} (${client.email})`);
	console.log(
		`   - Client2: ${client2.username} (${client2.email}) - Password: client123`,
	);
	console.log(
		`   - Client3: ${client3.username} (${client3.email}) - Password: client123`,
	);
};
