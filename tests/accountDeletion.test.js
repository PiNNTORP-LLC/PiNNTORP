// import test, { beforeEach } from "node:test";
// import assert from "node:assert/strict";

// import { ensureUserState, state, replaceState } from "../js/core/state.js";
// import { deleteCurrentAccount } from "../js/account/account.js";

// globalThis.localStorage = {
//     data: {},
//     clear() {
//         this.data = {};
//     },
//     getItem(key) {
//         return this.data[key] ?? null;
//     },
//     setItem(key, value) {
//         this.data[key] = String(value);
//     }
// };

// function seedAccountState() {
//     replaceState({
//         currentUser: "main_user",
//         users: {
//             main_user: {
//                 gamesPlayed: 12,
//                 wins: 8,
//                 losses: 4,
//                 profit: 65,
//                 friends: ["dummy_alice", "dummy_bob"],
//                 favoriteGames: ["Slots"]
//             },
//             dummy_alice: {
//                 gamesPlayed: 6,
//                 wins: 4,
//                 losses: 2,
//                 profit: 15,
//                 friends: ["main_user"],
//                 favoriteGames: ["Slots"]
//             },
//             dummy_bob: {
//                 gamesPlayed: 9,
//                 wins: 3,
//                 losses: 6,
//                 profit: -10,
//                 friends: ["main_user", "dummy_alice"],
//                 favoriteGames: ["Dice Roll"]
//             }
//         }
//     });
// }

// beforeEach(() => {
//     globalThis.localStorage.clear();
//     seedAccountState();
// });

// test("ensureUserState adds a new signed-in user without reusing main_user stats", () => {
//     const sessionUser = ensureUserState("new_user");
//     sessionUser.wins = 9;

//     assert.equal(state.users.new_user.wins, 9);
//     assert.equal(state.users.main_user.wins, 8);
// });

// test("red: deleting the current account removes that user from the state", () => {
//     const deletedUsername = deleteCurrentAccount();

//     assert.equal(deletedUsername, "main_user");
//     assert.equal(state.users.main_user, undefined);
//     assert.equal(state.currentUser, null);
// });

// test("deleting the current account also removes that username from every remaining friend list", () => {
//     deleteCurrentAccount();

//     assert.deepEqual(state.users.dummy_alice.friends, []);
//     assert.deepEqual(state.users.dummy_bob.friends, ["dummy_alice"]);
// });

// test("deleting the current account persists the updated users map to localStorage", () => {
//     deleteCurrentAccount();

//     const savedState = JSON.parse(globalThis.localStorage.getItem("pinntorp_state_v1"));
//     assert.equal(savedState.currentUser, null);
//     assert.equal(savedState.users.main_user, undefined);
//     assert.deepEqual(savedState.users.dummy_alice.friends, []);
//     assert.deepEqual(savedState.users.dummy_bob.friends, ["dummy_alice"]);
// });

import test from "node:test";

test.todo("[UT-10] deleting an account removes it from storage");
test.todo("[UT-11] deleting an account removes the user from all friend lists");
test.todo("[UT-12] deleting an account that does not exist returns an error");
test.todo("[UT-19] no leftover data remains in storage after deleting an account");
test.todo("[IT-11] user data is cleaned up properly after registering then deleting an account");
test.todo("[ST-08] delete an account and verify login is rejected afterward");
test.todo("[ST-09] delete a friend and verify they disappear from the friend list");