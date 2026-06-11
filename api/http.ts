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

import axios from 'axios';

const http = axios.create({
    baseURL: '/api',
    timeout: 5000,
    withCredentials: true,
});

http.interceptors.response.use(
    (res) => {
        return res.data;
    },
    (error) => {
        console.error("请求异常", error);
        if (error.status === 401) {
            window.location.href = '/login';
            return Promise.reject(new Error('Unauthorized'));
        }
        return Promise.reject(error);
    }
);


export default http;
