import { addFriend, getFriends, removeFriend } from "./friends.js";
import { renderRec } from "../recommendation/recView.js";

function renderFriends(list) {
    list.innerHTML = "";
    getFriends().forEach((friend) => {
    const item = document.createElement("li");
    const name = document.createElement("span");
    const del = document.createElement("button");

    name.textContent = friend;
    del.type = "button";
    del.textContent = "Delete";
    del.addEventListener("click", () => {
        removeFriend(friend);
        renderFriends(list);
        renderRec();
    });

    item.appendChild(name);
    item.appendChild(del);
    list.appendChild(item);
    });
}

export function initFriendsView() {
    const list = document.getElementById("friends-list");
    const form = document.getElementById("friend-form");
    const input = document.getElementById("friend-name");

    renderFriends(list);

    form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!addFriend(input.value)) return;

    input.value = "";
    renderFriends(list);
    renderRec();
    });
    }