import test from 'ava'
import { createServer, TestFramework } from './_util.js'

let close
let api
let sim = new TestFramework()

test.before(async () => {
  let inst = await createServer()
  close = inst.close
  api = inst.api

  await sim.createCitizen(inst, 'alice')
  await sim.createCitizen(inst, 'bob')
  await sim.createCitizen(inst, 'carla')
  await sim.createCommunity(inst, 'folks')
  await sim.createCommunity(inst, 'ppl')
})

test.after.always(async t => {
	await close()
})

test('membership', async t => {
  const {alice, bob, carla, folks, ppl} = sim.users

  await alice.login()
  await api.communities.join(folks.userId)
  await api.communities.join(ppl.userId)
  await bob.login()
  await api.communities.join(folks.userId)
  await api.communities.join(ppl.userId)
  await carla.login()
  await api.communities.join(folks.userId)

  let members1 = await api.communities.listMembers(folks.userId)
  t.is(members1.length, 3)
  t.deepEqual(members1.find(m => m.value.user.userId === alice.userId).value.user.dbUrl, alice.profile.dbUrl)
  t.deepEqual(members1.find(m => m.value.user.userId === bob.userId).value.user.dbUrl, bob.profile.dbUrl)
  t.deepEqual(members1.find(m => m.value.user.userId === carla.userId).value.user.dbUrl, carla.profile.dbUrl)
  
  let members2 = await api.communities.listMembers(ppl.userId)
  t.is(members2.length, 2)
  t.deepEqual(members2.find(m => m.value.user.userId === alice.userId).value.user.dbUrl, alice.profile.dbUrl)
  t.deepEqual(members2.find(m => m.value.user.userId === bob.userId).value.user.dbUrl, bob.profile.dbUrl)

  let members3 = await api.communities.listMembers(folks.userId, {limit: 1})
  t.is(members3.length, 1)

  let memberships1 = await api.communities.listMemberships(alice.userId)
  t.is(memberships1.length, 2)
  t.deepEqual(memberships1.find(m => m.value.community.userId === folks.userId).value.community.dbUrl, folks.profile.dbUrl)
  t.deepEqual(memberships1.find(m => m.value.community.userId === ppl.userId).value.community.dbUrl, ppl.profile.dbUrl)

  let memberships2 = await api.communities.listMemberships(bob.userId)
  t.is(memberships2.length, 2)
  t.deepEqual(memberships2.find(m => m.value.community.userId === folks.userId).value.community.dbUrl, folks.profile.dbUrl)
  t.deepEqual(memberships2.find(m => m.value.community.userId === ppl.userId).value.community.dbUrl, ppl.profile.dbUrl)

  let memberships3 = await api.communities.listMemberships(carla.userId)
  t.is(memberships3.length, 1)
  t.deepEqual(memberships3.find(m => m.value.community.userId === folks.userId).value.community.dbUrl, folks.profile.dbUrl)

  let memberships4 = await api.communities.listMemberships(alice.userId, {limit: 1})
  t.is(memberships4.length, 1)

  await alice.login()
  await api.communities.leave(ppl.userId)
  await bob.login()
  await api.communities.leave(folks.userId)
  await api.communities.leave(ppl.userId)

  let members4 = await api.communities.listMembers(folks.userId)
  t.is(members4.length, 2)
  t.deepEqual(members4.find(m => m.value.user.userId === alice.userId).value.user.dbUrl, alice.profile.dbUrl)
  t.deepEqual(members4.find(m => m.value.user.userId === carla.userId).value.user.dbUrl, carla.profile.dbUrl)
  
  let members5 = await api.communities.listMembers(ppl.userId)
  t.is(members5.length, 0)

  let memberships5 = await api.communities.listMemberships(alice.userId)
  t.is(memberships5.length, 1)
  t.deepEqual(memberships5.find(m => m.value.community.userId === folks.userId).value.community.dbUrl, folks.profile.dbUrl)

  let memberships6 = await api.communities.listMemberships(bob.userId)
  t.is(memberships6.length, 0)

  let memberships7 = await api.communities.listMemberships(carla.userId)
  t.is(memberships7.length, 1)
  t.deepEqual(memberships7.find(m => m.value.community.userId === folks.userId).value.community.dbUrl, folks.profile.dbUrl)
})
