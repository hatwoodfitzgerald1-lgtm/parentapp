import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const parentPassword = await bcrypt.hash('Parent123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'User',
    },
  });

  const parent = await prisma.user.upsert({
    where: { email: 'parent1@demo.com' },
    update: {},
    create: {
      email: 'parent1@demo.com',
      passwordHash: parentPassword,
      role: 'PARENT',
      firstName: 'Sarah',
      lastName: 'Johnson',
    },
  });

  const child1 = await prisma.child.upsert({
    where: { id: 'child-emma-001' },
    update: {},
    create: {
      id: 'child-emma-001',
      firstName: 'Emma',
      lastName: 'Johnson',
      birthday: new Date('2017-05-15'),
      className: '1st Grade',
    },
  });

  const child2 = await prisma.child.upsert({
    where: { id: 'child-noah-001' },
    update: {},
    create: {
      id: 'child-noah-001',
      firstName: 'Noah',
      lastName: 'Johnson',
      birthday: new Date('2019-08-22'),
      className: 'Pre-K',
    },
  });

  await prisma.parentChild.upsert({
    where: {
      parentId_childId: {
        parentId: parent.id,
        childId: child1.id,
      },
    },
    update: {},
    create: {
      parentId: parent.id,
      childId: child1.id,
    },
  });

  await prisma.parentChild.upsert({
    where: {
      parentId_childId: {
        parentId: parent.id,
        childId: child2.id,
      },
    },
    update: {},
    create: {
      parentId: parent.id,
      childId: child2.id,
    },
  });

  await prisma.safetyPolicy.upsert({
    where: { childId: child1.id },
    update: {},
    create: {
      childId: child1.id,
      ageRating: 'G',
      blockedKeywords: JSON.stringify(['violence', 'location', 'phone number']),
      allowedTopics: JSON.stringify(['science', 'art', 'nature', 'animals']),
      dailyMinutesMax: 45,
      quietStartMin: 20 * 60,
      quietEndMin: 7 * 60,
      cloudVersion: 1,
      deviceVersion: 0,
    },
  });

  await prisma.safetyPolicy.upsert({
    where: { childId: child2.id },
    update: {},
    create: {
      childId: child2.id,
      ageRating: 'G',
      blockedKeywords: JSON.stringify(['violence', 'location', 'phone number']),
      dailyMinutesMax: 30,
      quietStartMin: 19 * 60,
      quietEndMin: 7 * 60,
      cloudVersion: 1,
      deviceVersion: 0,
    },
  });

  const device = await prisma.device.upsert({
    where: { id: 'toy-demo-001' },
    update: {},
    create: {
      id: 'toy-demo-001',
      ownerId: parent.id,
      childId: child1.id,
      displayName: 'Emma\'s AI Toy',
      tpuPresent: true,
      firmwareVersion: '1.0.0',
      batteryPct: 85,
      playTimeMin: 127,
      adventuresCount: 8,
      status: 'online',
      lastSeen: new Date(),
    },
  });

  const session = await prisma.childChatSession.create({
    data: {
      id: 'session-demo-001',
      childId: child1.id,
      source: 'toy',
      deviceId: device.id,
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  });

  const messages = [
    { role: 'CHILD', content: 'Hi! Can we talk about dinosaurs?', offset: 0 },
    { role: 'ASSISTANT', content: 'Of course! I love talking about dinosaurs! Which dinosaur is your favorite?', offset: 15 },
    { role: 'CHILD', content: 'I like T-Rex because they are really big and strong!', offset: 35 },
    { role: 'ASSISTANT', content: 'T-Rex was indeed one of the largest carnivorous dinosaurs! Did you know T-Rex had tiny arms compared to its huge body?', offset: 55 },
    { role: 'CHILD', content: 'Yeah! Why were their arms so small?', offset: 80 },
    { role: 'ASSISTANT', content: 'That\'s a great question! Scientists think T-Rex used its powerful jaws and teeth for hunting, so it didn\'t need big arms. The small arms might have helped it balance when running!', offset: 95 },
  ];

  for (const msg of messages) {
    await prisma.childChatMessage.create({
      data: {
        sessionId: session.id,
        role: msg.role as any,
        content: msg.content,
        createdAt: new Date(session.startedAt.getTime() + msg.offset * 1000),
        tokens: msg.content.split(' ').length * 1.3,
        topicTags: JSON.stringify(['dinosaurs', 'science', 'animals']),
      },
    });
  }

  await prisma.highlight.create({
    data: {
      childId: child1.id,
      title: 'Curious About Dinosaurs',
      summary: 'Emma showed wonderful curiosity asking "why" questions about T-Rex anatomy. She made connections between size and strength, demonstrating early scientific thinking.',
      category: 'Curiosity',
      occurredAt: new Date(session.startedAt.getTime() + 90 * 1000),
      sourceSessionId: session.id,
    },
  });

  await prisma.highlight.create({
    data: {
      childId: child1.id,
      title: 'Creative Storytelling',
      summary: 'Emma created an imaginative story about a friendly dragon who helps lost animals find their way home.',
      category: 'Creativity',
      occurredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  });

  console.log('Database seeded successfully!');
  console.log('\n=== Seed Logins ===');
  console.log('Admin: admin@demo.com / Admin123!');
  console.log('Parent: parent1@demo.com / Parent123!');
  console.log('\n=== Seeded Data ===');
  console.log(`- ${2} children (Emma, Noah)`);
  console.log(`- ${1} device (toy-demo-001)`);
  console.log(`- ${1} conversation session with ${messages.length} messages`);
  console.log(`- ${2} highlights`);
  console.log(`- Safety policies with blocked keywords and quiet hours`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
