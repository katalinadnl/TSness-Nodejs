import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Gym } from "../models/Gym";
import { UserRole } from "../models/common/enums";

export const seedUsers = async () => {
	await User.deleteMany({});

	const hashedSuperAdminPassword = await bcrypt.hash("superadmin123", 10);
	const hashedAdminPassword = await bcrypt.hash("admin123", 10);
	const hashedGymOwnerPassword = await bcrypt.hash("gymowner123", 10);
	const hashedClientPassword = await bcrypt.hash("client123", 10);

	const superAdmin = {
		username: "superadmin",
		email: "superadmin@example.com",
		password: hashedSuperAdminPassword,
		firstName: "Super",
		lastName: "Admin",
		role: UserRole.SUPER_ADMIN,
		isActive: true,
	};

	await User.insertMany(superAdmin);

	const admins = [];
	for (let i = 1; i <= 3; i++) {
		admins.push({
			username: `admin${i}`,
			email: `admin${i}@example.com`,
			password: hashedAdminPassword,
			firstName: `Admin${i}`,
			lastName: `Super${i}`,
			role: UserRole.SUPER_ADMIN,
			isActive: true,
		});
	}
	await User.insertMany(admins);

	const gymowners = [];
	for (let i = 1; i <= 3; i++) {
		gymowners.push({
			username: `gymowner${i}`,
			email: `gymowner${i}@example.com`,
			password: hashedGymOwnerPassword,
			firstName: `GymOwner${i}`,
			lastName: `Pro${i}`,
			role: UserRole.GYM_OWNER,
			isActive: true,
		});
	}
	await User.insertMany(gymowners);

	const clients = [];
	for (let i = 1; i <= 15; i++) {
		clients.push({
			username: `client${i}`,
			email: `client${i}@example.com`,
			password: hashedClientPassword,
			firstName: `Client${i}`,
			lastName: `User${i}`,
			role: UserRole.CLIENT,
			isActive: true,
		});
	}
	await User.insertMany(clients);
};
