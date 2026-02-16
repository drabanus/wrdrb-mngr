import { PrismaClient } from '@prisma/client';
import { Scrypt } from 'oslo/password';

const prisma = new PrismaClient();
const scrypt = new Scrypt();

async function main() {
	console.log('Seeding database...');

	// Clear existing data
	await prisma.emailLog.deleteMany();
	await prisma.scanEvent.deleteMany();
	await prisma.receptionCheck.deleteMany();
	await prisma.dispatchEvent.deleteMany();
	await prisma.todoItem.deleteMany();
	await prisma.tag.deleteMany();
	await prisma.clothingAssignment.deleteMany();
	await prisma.bagAssignment.deleteMany();
	await prisma.parent.deleteMany();
	await prisma.measurement.deleteMany();
	await prisma.clothingPiece.deleteMany();
	await prisma.bag.deleteMany();
	await prisma.gig.deleteMany();
	await prisma.session.deleteMany();
	await prisma.child.deleteMany();
	await prisma.user.deleteMany();
	await prisma.appSettings.deleteMany();

	// App Settings
	await prisma.appSettings.create({
		data: { id: 'global', orgName: 'Hasenschule' }
	});

	// Users
	const adminHash = await scrypt.hash('admin123');
	const admin = await prisma.user.create({
		data: {
			username: 'admin',
			passwordHash: adminHash,
			name: 'Anna Müller',
			email: 'anna@hasenschule.de',
			role: 'admin'
		}
	});

	const receptionHash = await scrypt.hash('empfang123');
	await prisma.user.create({
		data: {
			username: 'empfang',
			passwordHash: receptionHash,
			name: 'Beate Schmidt',
			email: 'beate@hasenschule.de',
			role: 'receptionist'
		}
	});

	const laundryHash = await scrypt.hash('waesche123');
	const laundryUser = await prisma.user.create({
		data: {
			username: 'waesche',
			passwordHash: laundryHash,
			name: 'Clara Weber',
			email: 'clara@hasenschule.de',
			role: 'laundry'
		}
	});

	const menderHash = await scrypt.hash('naehen123');
	const menderUser = await prisma.user.create({
		data: {
			username: 'naeherei',
			passwordHash: menderHash,
			name: 'Dorothea Fischer',
			email: 'dorothea@hasenschule.de',
			role: 'mender'
		}
	});

	// Children - mix of boys and girls, ages 2-22
	const childrenData = [
		{ firstName: 'Lena', lastName: 'Bauer', birthDate: new Date('2018-03-15'), gender: 'girl' },
		{ firstName: 'Max', lastName: 'Hoffmann', birthDate: new Date('2016-07-22'), gender: 'boy' },
		{ firstName: 'Sophie', lastName: 'Klein', birthDate: new Date('2014-11-08'), gender: 'girl' },
		{ firstName: 'Felix', lastName: 'Wagner', birthDate: new Date('2019-01-30'), gender: 'boy' },
		{ firstName: 'Emma', lastName: 'Schulz', birthDate: new Date('2012-05-14'), gender: 'girl' },
		{ firstName: 'Lukas', lastName: 'Becker', birthDate: new Date('2015-09-03'), gender: 'boy' },
		{ firstName: 'Mia', lastName: 'Richter', birthDate: new Date('2020-12-25'), gender: 'girl' },
		{ firstName: 'Paul', lastName: 'Wolf', birthDate: new Date('2008-02-18'), gender: 'boy' },
		{ firstName: 'Hannah', lastName: 'Schäfer', birthDate: new Date('2017-06-11'), gender: 'girl' },
		{ firstName: 'Tim', lastName: 'Koch', birthDate: new Date('2010-10-05'), gender: 'boy' },
		{ firstName: 'Lea', lastName: 'Braun', birthDate: new Date('2013-04-20'), gender: 'girl' },
		{ firstName: 'Jonas', lastName: 'Hartmann', birthDate: new Date('2006-08-09'), gender: 'boy' },
		{ firstName: 'Marie', lastName: 'Lange', birthDate: new Date('2021-07-03'), gender: 'girl' },
		{ firstName: 'Leon', lastName: 'Werner', birthDate: new Date('2011-12-17'), gender: 'boy' },
		{ firstName: 'Clara', lastName: 'Meier', birthDate: new Date('2004-03-28'), gender: 'girl' }
	];

	const children = [];
	for (const data of childrenData) {
		const child = await prisma.child.create({ data });
		children.push(child);

		// Add parent contacts
		await prisma.parent.create({
			data: {
				childId: child.id,
				name: `Frau ${data.lastName}`,
				phone: `+49 170 ${Math.floor(1000000 + Math.random() * 9000000)}`,
				email: `${data.lastName.toLowerCase()}@example.de`,
				relation: 'parent'
			}
		});

		// Add measurements based on approximate age
		const ageYears =
			(Date.now() - data.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
		const heightCm = Math.round(50 + ageYears * 6.5 + Math.random() * 5);
		const size =
			heightCm < 86 ? '86' :
			heightCm < 92 ? '92' :
			heightCm < 98 ? '98' :
			heightCm < 104 ? '104' :
			heightCm < 110 ? '110' :
			heightCm < 116 ? '116' :
			heightCm < 122 ? '122' :
			heightCm < 128 ? '128' :
			heightCm < 134 ? '134' :
			heightCm < 140 ? '140' :
			heightCm < 146 ? '146' :
			heightCm < 152 ? '152' :
			heightCm < 158 ? '158' :
			heightCm < 164 ? '164' :
			heightCm < 170 ? '170' : '176';

		// Older measurement (6 months ago)
		await prisma.measurement.create({
			data: {
				childId: child.id,
				measuredAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
				heightCm: heightCm - 3,
				armLengthCm: Math.round(heightCm * 0.32),
				legLengthCm: Math.round(heightCm * 0.45),
				headCircCm: Math.round(45 + ageYears * 0.8),
				bellyCircCm: Math.round(40 + ageYears * 2.5),
				hipCircCm: Math.round(42 + ageYears * 2.3),
				clothingSize: size,
				shoeSize: String(Math.round(16 + ageYears * 1.5))
			}
		});

		// Current measurement
		await prisma.measurement.create({
			data: {
				childId: child.id,
				measuredAt: new Date(),
				heightCm,
				armLengthCm: Math.round(heightCm * 0.33),
				legLengthCm: Math.round(heightCm * 0.46),
				headCircCm: Math.round(45 + ageYears * 0.8 + 0.3),
				bellyCircCm: Math.round(40 + ageYears * 2.5 + 1),
				hipCircCm: Math.round(42 + ageYears * 2.3 + 1),
				clothingSize: size,
				shoeSize: String(Math.round(16 + ageYears * 1.5))
			}
		});
	}

	// Create bags and clothing for each child
	for (const child of children) {
		const isGirl = child.gender === 'girl';

		// Clothing bag
		const clothingBag = await prisma.bag.create({
			data: { type: 'clothing_bag', label: `${child.firstName} ${child.lastName}` }
		});

		// Shoe bag
		const shoeBag = await prisma.bag.create({
			data: { type: 'shoe_bag', label: `${child.firstName} ${child.lastName} - Schuhe` }
		});

		// Assign bags to child
		await prisma.bagAssignment.create({
			data: { bagId: clothingBag.id, childId: child.id }
		});
		await prisma.bagAssignment.create({
			data: { bagId: shoeBag.id, childId: child.id }
		});

		// Get latest measurement for sizing
		const measurement = await prisma.measurement.findFirst({
			where: { childId: child.id },
			orderBy: { measuredAt: 'desc' }
		});
		const size = measurement?.clothingSize || '128';

		// Create clothing pieces
		if (isGirl) {
			const kleid = await prisma.clothingPiece.create({
				data: { type: 'kleid', size, bagId: clothingBag.id, season: 'all' }
			});
			await prisma.clothingAssignment.create({
				data: { clothingPieceId: kleid.id, childId: child.id }
			});

			const schuerze = await prisma.clothingPiece.create({
				data: { type: 'schuerze', size, bagId: clothingBag.id, season: 'all' }
			});
			await prisma.clothingAssignment.create({
				data: { clothingPieceId: schuerze.id, childId: child.id }
			});
		} else {
			const hemd = await prisma.clothingPiece.create({
				data: { type: 'hemd', size, bagId: clothingBag.id, season: 'all' }
			});
			await prisma.clothingAssignment.create({
				data: { clothingPieceId: hemd.id, childId: child.id }
			});

			const weste = await prisma.clothingPiece.create({
				data: { type: 'weste', size, bagId: clothingBag.id, season: 'all' }
			});
			await prisma.clothingAssignment.create({
				data: { clothingPieceId: weste.id, childId: child.id }
			});

			const hose = await prisma.clothingPiece.create({
				data: { type: 'hose', size, bagId: clothingBag.id, season: 'winter' }
			});
			await prisma.clothingAssignment.create({
				data: { clothingPieceId: hose.id, childId: child.id }
			});

			const shorts = await prisma.clothingPiece.create({
				data: { type: 'shorts', size, bagId: clothingBag.id, season: 'summer' }
			});
			await prisma.clothingAssignment.create({
				data: { clothingPieceId: shorts.id, childId: child.id }
			});
		}

		// Shoes in shoe bag
		const shoes = await prisma.clothingPiece.create({
			data: {
				type: 'shoes',
				size: measurement?.shoeSize || '30',
				bagId: shoeBag.id,
				season: 'all'
			}
		});
		await prisma.clothingAssignment.create({
			data: { clothingPieceId: shoes.id, childId: child.id }
		});

		// Create QR tags for bags
		const bagNum = String(children.indexOf(child) + 1).padStart(3, '0');
		await prisma.tag.create({
			data: {
				type: 'qr',
				code: `BAG-${bagNum}-C`,
				linkedToType: 'bag',
				linkedToBagId: clothingBag.id
			}
		});
		await prisma.tag.create({
			data: {
				type: 'qr',
				code: `BAG-${bagNum}-S`,
				linkedToType: 'bag',
				linkedToBagId: shoeBag.id
			}
		});
	}

	// Create upcoming gigs
	const now = new Date();
	await prisma.gig.create({
		data: {
			name: 'Frühlingskonzert',
			date: new Date(now.getFullYear(), now.getMonth() + 1, 15),
			location: 'Stadttheater',
			status: 'upcoming'
		}
	});
	await prisma.gig.create({
		data: {
			name: 'Osteraufführung',
			date: new Date(now.getFullYear(), 3, 12),
			location: 'Gemeindezentrum',
			status: 'upcoming'
		}
	});
	await prisma.gig.create({
		data: {
			name: 'Sommerkonzert',
			date: new Date(now.getFullYear(), 6, 5),
			location: 'Parkbühne',
			status: 'upcoming'
		}
	});

	// Create some sample todos
	await prisma.todoItem.create({
		data: {
			type: 'laundry',
			title: 'Wäsche waschen - Frühlingskonzert Vorbereitung',
			description: '5 Kleider und 3 Hemden waschen',
			priority: 'high',
			status: 'open',
			assignedTo: laundryUser.id,
			dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 10)
		}
	});
	await prisma.todoItem.create({
		data: {
			type: 'repair',
			title: 'Knopf annähen - Weste Max Hoffmann',
			description: 'Oberer Knopf fehlt',
			priority: 'normal',
			status: 'open',
			assignedTo: menderUser.id
		}
	});
	await prisma.todoItem.create({
		data: {
			type: 'size_change',
			title: 'Neue Größe für Paul Wolf',
			description: 'Paul ist aus Größe 164 herausgewachsen, benötigt 170',
			priority: 'normal',
			status: 'open',
			assignedTo: admin.id
		}
	});

	console.log('Seed complete!');
	console.log('Login credentials:');
	console.log('  admin / admin123 (Administrator)');
	console.log('  empfang / empfang123 (Empfang)');
	console.log('  waesche / waesche123 (Wäsche)');
	console.log('  naeherei / naehen123 (Schneiderei)');
}

main()
	.catch(console.error)
	.finally(() => prisma.$disconnect());
