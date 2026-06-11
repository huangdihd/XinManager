/*
 *   Copyright (C) 2025 huangdihd
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License
 *   along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import http from "./http";
import {type BotStatus} from "./BotStatus";
export async function getBots() {
    return http.get<BotStatus[]>('/bots');
}

export async function addBot(url: string, token: string){
    return http.post('/bots/create', {
        url: url,
        token: token,
    })
}

export async function deleteBot(id: number){
    console.log(id);
    return http.delete(`/bots/${id}`);
}

export async function getBot(id: number) {
    return http.get<BotStatus>(`/bots/${id}`);
}
