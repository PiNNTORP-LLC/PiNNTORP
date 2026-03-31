import { isLoggedIn, getSession } from "../core/auth.js";
import { getFriends, addFriend, removeFriend } from "./friends.js";
import { renderRec } from "../recommendation/recView.js";
import { state } from "../core/state.js";
import { saveState } from "../core/storage.js";

/*
* MODULE: Friends List Logic (friendsView.js)
*-------------------------------------------------------
* Purpose: Initialize the view for the users friends list
* UI logic for rendering the friends list and handling the add/remove buttons
*/

const FRIENDS_API = "http://localhost:5500";
const DUMMY_USERS = ["dummy_alice", "dummy_bob", "dummy_charlie"];

async function friendsPost(body) {
    const { sessionId, playerId } = getSession();
    try {
        const res = await fetch(`${FRIENDS_API}/friends`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...body, sessionID: sessionId, playerID: playerId })
        });
        return res.ok ? await res.json() : null;
    } catch {
        return null;
    }
}

// Sync backend friend usernames into local state so recommendations work
function syncToLocalState(backendFriends) {
    const user = state.users[state.currentUser];
    if (!user) return;
    backendFriends.forEach(({ username }) => {
        if (!user.friends.includes(username)) user.friends.push(username);
        if (!state.users[username]) {
            state.users[username] = {
                balance: 0, gamesPlayed: 0, wins: 0, losses: 0,
                profit: 0, friends: [], favoriteGames: [], history: []
            };
        }
    });
    saveState(state);
}

function makeFriendItem(name, onRemove) {
    const li = document.createElement("li");
    li.className = "friend-item";

    const nameEl = document.createElement("span");
    nameEl.className = "friend-name";
    nameEl.textContent = name;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "friend-action-btn friend-remove-btn";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", onRemove);

    li.appendChild(nameEl);
    li.appendChild(removeBtn);
    return li;
}

function makeRequestItem(name, actions) {
    const li = document.createElement("li");
    li.className = "friend-item";

    const nameEl = document.createElement("span");
    nameEl.className = "friend-name";
    nameEl.textContent = name;
    li.appendChild(nameEl);

    actions.forEach(({ label, cls, onClick }) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `friend-action-btn ${cls}`;
        btn.textContent = label;
        btn.addEventListener("click", onClick);
        li.appendChild(btn);
    });

    return li;
}

function setEmpty(el, text) {
    el.innerHTML = `<li class="friend-empty">${text}</li>`;
}

async function refresh() {
    const list             = document.getElementById("friends-list");
    const receivedList     = document.getElementById("received-requests-list");
    const sentList         = document.getElementById("sent-requests-list");
    const requestsSection  = document.getElementById("friend-requests-section");
    const offlineNote      = document.getElementById("friend-offline-note");

    if (!list) return;

    if (!isLoggedIn()) {
        if (offlineNote) offlineNote.classList.remove("hidden");
        if (requestsSection) requestsSection.classList.add("hidden");
        setEmpty(list, "Log in to see your friends.");
        return;
    }

    if (offlineNote) offlineNote.classList.add("hidden");
    if (requestsSection) requestsSection.classList.remove("hidden");

    const [friendsData, requestsData] = await Promise.all([
        friendsPost({ action: "list-friends" }),
        friendsPost({ action: "list-requests" })
    ]);

    // Friends list
    list.innerHTML = "";
    const friends = friendsData?.friends ?? null;

    if (friends === null) {
        // Backend unreachable — fall back to local
        renderLocalFriends(list);
    } else {
        syncToLocalState(friends);

        // Dummy friends that the user has manually added (local only)
        const localUser = state.users[state.currentUser];
        const addedDummies = localUser
            ? DUMMY_USERS.filter(d => localUser.friends.includes(d))
            : [];

        if (friends.length === 0 && addedDummies.length === 0) {
            setEmpty(list, "No friends yet.");
        } else {
            friends.forEach(({ username, playerID }) => {
                list.appendChild(makeFriendItem(username, async () => {
                    await friendsPost({ action: "remove", friendID: playerID });
                    removeFriend(username);
                    refresh();
                    renderRec();
                }));
            });
            addedDummies.forEach(dummyName => {
                list.appendChild(makeFriendItem(dummyName, () => {
                    removeFriend(dummyName);
                    refresh();
                    renderRec();
                }));
            });
        }
    }

    // Received requests
    if (receivedList) {
        receivedList.innerHTML = "";
        const received = requestsData?.received ?? [];
        if (received.length === 0) {
            setEmpty(receivedList, "No incoming requests.");
        } else {
            received.forEach(({ username, playerID }) => {
                receivedList.appendChild(makeRequestItem(username, [
                    {
                        label: "Accept", cls: "friend-accept-btn",
                        onClick: async () => {
                            await friendsPost({ action: "accept", friendID: playerID });
                            refresh();
                            renderRec();
                        }
                    },
                    {
                        label: "Decline", cls: "friend-decline-btn",
                        onClick: async () => {
                            await friendsPost({ action: "decline", friendID: playerID });
                            refresh();
                        }
                    }
                ]));
            });
        }
    }

    // Sent requests
    if (sentList) {
        sentList.innerHTML = "";
        const sent = requestsData?.sent ?? [];
        if (sent.length === 0) {
            setEmpty(sentList, "No sent requests.");
        } else {
            sent.forEach(({ username, playerID }) => {
                sentList.appendChild(makeRequestItem(username, [
                    {
                        label: "Cancel", cls: "friend-decline-btn",
                        onClick: async () => {
                            await friendsPost({ action: "cancel", friendID: playerID });
                            refresh();
                        }
                    }
                ]));
            });
        }
    }
}

function renderLocalFriends(list) {
    const friends = getFriends();
    list.innerHTML = "";
    if (friends.length === 0) {
        setEmpty(list, "No friends yet.");
        return;
    }
    friends.forEach(name => {
        list.appendChild(makeFriendItem(name, () => {
            removeFriend(name);
            renderLocalFriends(list);
            renderRec();
        }));
    });
}

function addLocalFriendAndRefresh(username) {
    if (!addFriend(username)) return false;
    refresh();
    renderRec();
    return true;
}

export function initFriendsView() {
    const form   = document.getElementById("friend-form");
    const input  = document.getElementById("friend-name");
    const status = document.getElementById("friend-status");

    if (!form || !input) return;

    refresh();

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = input.value.trim().toLowerCase();
        if (!username) return;

        if (isLoggedIn()) {
            // Dummy accounts: skip backend, add locally and show immediately
            if (DUMMY_USERS.includes(username)) {
                const added = addLocalFriendAndRefresh(username);
                input.value = "";
                if (status) {
                    status.textContent = added ? `${username} added!` : `Already friends with ${username}.`;
                    setTimeout(() => { status.textContent = ""; }, 3000);
                }
                return;
            }

            if (status) status.textContent = "Searching...";

            // Look up the target player's ID
            const found = await friendsPost({ action: "find", targetUsername: username });
            if (!found?.found) {
                if (status) status.textContent = "User not found.";
                return;
            }

            await friendsPost({ action: "add", friendID: found.playerID });
            input.value = "";
            if (status) {
                status.textContent = `Request sent to ${username}.`;
                setTimeout(() => { status.textContent = ""; }, 3000);
            }
            refresh();
        } else {
            if (!addLocalFriendAndRefresh(username)) return;
            input.value = "";
        }
    });
}
