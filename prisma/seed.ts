/**
 * Dev/test seeds. NOT for production.
 *
 * Zero admin:
 *   email:    admin@market-hunter.local
 *   password: Aa12345678   (digits 1–8 + A + a)
 *
 * Regular user:
 *   email:    user@market-hunter.local
 *   password: Aa12345678
 *
 * Run: yarn prisma db seed   (or yarn seed)
 */
import { PrismaClient, Role } from '@prisma/client';
import { genSaltSync, hashSync } from 'bcrypt';

const prisma = new PrismaClient();

const TEST_PASSWORD = 'Aa12345678';
const hash = () => hashSync(TEST_PASSWORD, genSaltSync(10));

async function upsertUser(email: string, roles: Role[]) {
    return prisma.user.upsert({
        where: { email },
        update: {
            password: hash(),
            roles,
            isBlocked: false,
        },
        create: {
            email,
            password: hash(),
            roles,
            isBlocked: false,
        },
    });
}

async function ensureProfile(userId: string, firstName: string, lastName: string) {
    const existing = await prisma.profile.findUnique({ where: { userId } });
    if (existing) {
        return prisma.profile.update({
            where: { userId },
            data: { firstName, lastName, currentStatus: 'active' },
        });
    }
    return prisma.profile.create({
        data: {
            userId,
            firstName,
            lastName,
            currentStatus: 'active',
            balance: 100,
            spinCount: 0,
            successfulResponsesCount: 0,
        },
    });
}

async function main() {
    const admin = await upsertUser('admin@market-hunter.local', [Role.ADMIN, Role.USER]);
    const user = await upsertUser('user@market-hunter.local', [Role.USER]);

    await ensureProfile(admin.id, 'Admin', 'Zero');
    await ensureProfile(user.id, 'Test', 'User');

    // Sample resume for regular user
    const resumeCount = await prisma.resume.count({ where: { userId: user.id } });
    if (resumeCount === 0) {
        const resume = await prisma.resume.create({
            data: {
                userId: user.id,
                fullName: 'Test User',
                position: 'Frontend Developer',
                employmentType: 'full',
                workSchedule: 'remote',
                contacts: {
                    create: {
                        email: 'user@market-hunter.local',
                        phone: '+70000000000',
                        personalSite: 'https://example.com',
                    },
                },
                skills: {
                    create: [
                        { skillName: 'TypeScript', proficiencyLevel: 'advanced' },
                        { skillName: 'React', proficiencyLevel: 'advanced' },
                    ],
                },
                workExperience: {
                    create: {
                        companyName: 'Demo Corp',
                        position: 'Frontend Developer',
                        startDate: new Date('2023-01-01'),
                        endDate: null,
                        description: 'Seed work experience for local testing.',
                    },
                },
            },
        });
        console.log('resume', resume.id);
    }

    // HH form presets for user
    const authCount = await prisma.vacancyAuth.count({ where: { userId: user.id } });
    if (authCount === 0) {
        await prisma.vacancyAuth.create({
            data: {
                userId: user.id,
                email: 'hh-test@example.com',
                password: 'not-a-real-hh-password',
            },
        });
    }

    const submitCount = await prisma.vacancySubmit.count({ where: { userId: user.id } });
    if (submitCount === 0) {
        await prisma.vacancySubmit.create({
            data: {
                userId: user.id,
                position: 'Frontend Developer',
                message: 'Здравствуйте! Seed cover letter for local testing.',
                vacancyUrl:
                    'https://hh.ru/search/vacancy?text=frontend&search_field=name&schedule=remote',
                schedule: 'remote',
                orderBy: 'relevance',
                searchField: 'name',
                experience: 'between1And3',
                searchPeriod: '7',
            },
        });
    }

    // Active monthly subscription for user (payments smoke)
    const subCount = await prisma.subscription.count({ where: { userId: user.id } });
    if (subCount === 0) {
        const start = new Date();
        const end = new Date();
        end.setMonth(end.getMonth() + 1);
        const sub = await prisma.subscription.create({
            data: {
                userId: user.id,
                subscriptionType: 'monthly',
                price: 50,
                startDate: start,
                endDate: end,
            },
        });
        await prisma.payment.create({
            data: {
                userId: user.id,
                amount: 50,
                paymentStatus: 'completed',
                paymentMethod: 'seed',
            },
        });
        console.log('subscription', sub.id);
    }

    console.log('--- seed ok ---');
    console.log('admin: admin@market-hunter.local / Aa12345678');
    console.log('user:  user@market-hunter.local  / Aa12345678');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
