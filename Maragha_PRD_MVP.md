# Maragha MVP Product Requirements Document (PRD)

## 1. Brand Identity & Design System

**Color Palette:**
- Background: `#F3EFE0` (RGB: 243, 239, 224)
- Dark Blue (Ribbon/Text): `#29477B`
- Brown (Book): `#64463C`
- Gray (Feather Quill): `#A1A2A6`
- Gold (Compass Rose): `#D4A856`

**Typography:**
- Headings: Playfair Display (serif, classic, scholarly)
- Body: Inter (sans-serif, clean, readable)

**Visual Tone:**
Elegant, academic, and calm—reflecting heritage and knowledge.

---

## 2. Architecture Overview

**Frontend:** SvelteKit (SPA mode)
- SPA gives full control over routing and transitions.
- Can be deployed as static frontend (Vercel, Netlify, etc.).

**Backend:** PocketBase
- Acts as both database and API provider.
- Handles authentication, file storage, and realtime updates.
- Optional Go extensions for custom logic (not used in MVP).

**Security Layer:**
- Public access limited to read-only collections (e.g., public articles).
- Authenticated users have controlled access via collection rules.

---

## 3. Database Schema

### PocketBase Collections
```json
[
    {
        "id": "pbc_3256880740",
        "listRule": null,
        "viewRule": null,
        "createRule": null,
        "updateRule": null,
        "deleteRule": null,
        "name": "akses",
        "type": "base",
        "fields": [
            {
                "autogeneratePattern": "[A-Z][a-z]{14}",
                "hidden": false,
                "id": "text3208210256",
                "max": 15,
                "min": 4,
                "name": "id",
                "pattern": "^(?:[A-Z][a-z]+(?:\\s|$))+$",
                "presentable": false,
                "primaryKey": true,
                "required": true,
                "system": true,
                "type": "text"
            },
            {
                "hidden": false,
                "id": "autodate2990389176",
                "name": "created",
                "onCreate": true,
                "onUpdate": false,
                "presentable": false,
                "system": false,
                "type": "autodate"
            },
            {
                "hidden": false,
                "id": "autodate3332085495",
                "name": "updated",
                "onCreate": true,
                "onUpdate": true,
                "presentable": false,
                "system": false,
                "type": "autodate"
            }
        ],
        "indexes": [],
        "system": false
    },
    {
        "id": "_pb_users_auth_",
        "listRule": "id = @request.auth.id",
        "viewRule": "id = @request.auth.id",
        "createRule": "",
        "updateRule": "id = @request.auth.id",
        "deleteRule": "id = @request.auth.id",
        "name": "users",
        "type": "auth",
        "fields": [
            {
                "autogeneratePattern": "[a-z0-9]{15}",
                "hidden": false,
                "id": "text3208210256",
                "max": 15,
                "min": 15,
                "name": "id",
                "pattern": "^[a-z0-9]+$",
                "presentable": false,
                "primaryKey": true,
                "required": true,
                "system": true,
                "type": "text"
            },
            {
                "cost": 0,
                "hidden": true,
                "id": "password901924565",
                "max": 0,
                "min": 8,
                "name": "password",
                "pattern": "",
                "presentable": false,
                "required": true,
                "system": true,
                "type": "password"
            },
            {
                "autogeneratePattern": "[a-zA-Z0-9]{50}",
                "hidden": true,
                "id": "text2504183744",
                "max": 60,
                "min": 30,
                "name": "tokenKey",
                "pattern": "",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": true,
                "type": "text"
            },
            {
                "exceptDomains": null,
                "hidden": false,
                "id": "email3885137012",
                "name": "email",
                "onlyDomains": null,
                "presentable": false,
                "required": true,
                "system": true,
                "type": "email"
            },
            {
                "hidden": false,
                "id": "bool1547992806",
                "name": "emailVisibility",
                "presentable": false,
                "required": false,
                "system": true,
                "type": "bool"
            },
            {
                "hidden": false,
                "id": "bool256245529",
                "name": "verified",
                "presentable": false,
                "required": false,
                "system": true,
                "type": "bool"
            },
            {
                "autogeneratePattern": "",
                "hidden": false,
                "id": "text1579384326",
                "max": 255,
                "min": 0,
                "name": "name",
                "pattern": "",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "text"
            },
            {
                "hidden": false,
                "id": "file376926767",
                "maxSelect": 1,
                "maxSize": 0,
                "mimeTypes": [
                    "image/jpeg",
                    "image/png",
                    "image/svg+xml",
                    "image/gif",
                    "image/webp"
                ],
                "name": "avatar",
                "presentable": false,
                "protected": false,
                "required": false,
                "system": false,
                "thumbs": null,
                "type": "file"
            },
            {
                "cascadeDelete": false,
                "collectionId": "pbc_3256880740",
                "hidden": false,
                "id": "relation1466534506",
                "maxSelect": 1,
                "minSelect": 0,
                "name": "role",
                "presentable": false,
                "required": false,
                "system": false,
                "type": "relation"
            },
            {
                "hidden": false,
                "id": "autodate2990389176",
                "name": "created",
                "onCreate": true,
                "onUpdate": false,
                "presentable": false,
                "system": false,
                "type": "autodate"
            },
            {
                "hidden": false,
                "id": "autodate3332085495",
                "name": "updated",
                "onCreate": true,
                "onUpdate": true,
                "presentable": false,
                "system": false,
                "type": "autodate"
            }
        ],
        "indexes": [
            "CREATE UNIQUE INDEX `idx_tokenKey__pb_users_auth_` ON `users` (`tokenKey`)",
            "CREATE UNIQUE INDEX `idx_email__pb_users_auth_` ON `users` (`email`) WHERE `email` != ''"
        ],
        "system": false,
        "authRule": "",
        "manageRule": null,
        "authAlert": {
            "enabled": false,
            "emailTemplate": {
                "subject": "Login from a new location",
                "body": "<p>Hello,</p>\n<p>We noticed a login to your {APP_NAME} account from a new location.</p>\n<p>If this was you, you may disregard this email.</p>\n<p><strong>If this wasn't you, you should immediately change your {APP_NAME} account password to revoke access from all other locations.</strong></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>"
            }
        },
        "oauth2": {
            "mappedFields": {
                "id": "",
                "name": "name",
                "username": "",
                "avatarURL": "avatar"
            },
            "enabled": false
        },
        "passwordAuth": {
            "enabled": true,
            "identityFields": [
                "email"
            ]
        },
        "mfa": {
            "enabled": false,
            "duration": 1800,
            "rule": ""
        },
        "otp": {
            "enabled": false,
            "duration": 180,
            "length": 8,
            "emailTemplate": {
                "subject": "OTP for {APP_NAME}",
                "body": "<p>Hello,</p>\n<p>Your one-time password is: <strong>{OTP}</strong></p>\n<p><i>If you didn't ask for the one-time password, you can ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>"
            }
        },
        "authToken": {
            "duration": 604800
        },
        "passwordResetToken": {
            "duration": 1800
        },
        "emailChangeToken": {
            "duration": 1800
        },
        "verificationToken": {
            "duration": 259200
        },
        "fileToken": {
            "duration": 180
        },
        "verificationTemplate": {
            "subject": "Verify your {APP_NAME} email",
            "body": "<p>Hello,</p>\n<p>Thank you for joining us at {APP_NAME}.</p>\n<p>Click on the button below to verify your email address.</p>\n<p>\n  <a class=\"btn\" href=\"{APP_URL}/_/#/auth/confirm-verification/{TOKEN}\" target=\"_blank\" rel=\"noopener\">Verify</a>\n</p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>"
        },
        "resetPasswordTemplate": {
            "subject": "Reset your {APP_NAME} password",
            "body": "<p>Hello,</p>\n<p>Click on the button below to reset your password.</p>\n<p>\n  <a class=\"btn\" href=\"{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}\" target=\"_blank\" rel=\"noopener\">Reset password</a>\n</p>\n<p><i>If you didn't ask to reset your password, you can ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>"
        },
        "confirmEmailChangeTemplate": {
            "subject": "Confirm your {APP_NAME} new email address",
            "body": "<p>Hello,</p>\n<p>Click on the button below to confirm your new email address.</p>\n<p>\n  <a class=\"btn\" href=\"{APP_URL}/_/#/auth/confirm-email-change/{TOKEN}\" target=\"_blank\" rel=\"noopener\">Confirm new email</a>\n</p>\n<p><i>If you didn't ask to change your email address, you can ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>"
        }
    },
    {
        "id": "pbc_1664752192",
        "listRule": "",
        "viewRule": "",
        "createRule": null,
        "updateRule": null,
        "deleteRule": null,
        "name": "buku",
        "type": "base",
        "fields": [
            {
                "autogeneratePattern": "[a-z0-9]{15}",
                "hidden": false,
                "id": "text3208210256",
                "max": 15,
                "min": 15,
                "name": "id",
                "pattern": "^[a-z0-9]+$",
                "presentable": false,
                "primaryKey": true,
                "required": true,
                "system": true,
                "type": "text"
            },
            {
                "autogeneratePattern": "",
                "hidden": false,
                "id": "text282266467",
                "max": 0,
                "min": 0,
                "name": "judul",
                "pattern": "",
                "presentable": true,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "text"
            },
            {
                "hidden": false,
                "id": "number2681473394",
                "max": null,
                "min": 1,
                "name": "revisi",
                "onlyInt": true,
                "presentable": true,
                "required": true,
                "system": false,
                "type": "number"
            },
            {
                "autogeneratePattern": "",
                "hidden": false,
                "id": "text1422814226",
                "max": 0,
                "min": 0,
                "name": "edisi",
                "pattern": "",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "text"
            },
            {
                "hidden": false,
                "id": "select2063623452",
                "maxSelect": 1,
                "name": "status",
                "presentable": false,
                "required": true,
                "system": false,
                "type": "select",
                "values": [
                    "Draft",
                    "Terbit",
                    "Batal"
                ]
            },
            {
                "cascadeDelete": false,
                "collectionId": "pbc_1521283367",
                "hidden": false,
                "id": "relation451062078",
                "maxSelect": 1,
                "minSelect": 0,
                "name": "penerbit",
                "presentable": false,
                "required": false,
                "system": false,
                "type": "relation"
            },
            {
                "cascadeDelete": false,
                "collectionId": "pbc_4268996088",
                "hidden": false,
                "id": "relation1864419858",
                "maxSelect": 999,
                "minSelect": 0,
                "name": "penulis",
                "presentable": false,
                "required": true,
                "system": false,
                "type": "relation"
            },
            {
                "hidden": false,
                "id": "file2366146245",
                "maxSelect": 1,
                "maxSize": 0,
                "mimeTypes": [
                    "image/png",
                    "image/jpeg",
                    "image/webp"
                ],
                "name": "cover",
                "presentable": false,
                "protected": false,
                "required": false,
                "system": false,
                "thumbs": [],
                "type": "file"
            },
            {
                "cascadeDelete": false,
                "collectionId": "pbc_2286963209",
                "hidden": false,
                "id": "relation3357413904",
                "maxSelect": 999,
                "minSelect": 0,
                "name": "kategori",
                "presentable": false,
                "required": true,
                "system": false,
                "type": "relation"
            },
            {
                "hidden": false,
                "id": "autodate2990389176",
                "name": "created",
                "onCreate": true,
                "onUpdate": false,
                "presentable": false,
                "system": false,
                "type": "autodate"
            },
            {
                "hidden": false,
                "id": "autodate3332085495",
                "name": "updated",
                "onCreate": true,
                "onUpdate": true,
                "presentable": false,
                "system": false,
                "type": "autodate"
            }
        ],
        "indexes": [],
        "system": false
    },
    {
        "id": "pbc_1047869961",
        "listRule": null,
        "viewRule": null,
        "createRule": null,
        "updateRule": null,
        "deleteRule": null,
        "name": "halaman",
        "type": "base",
        "fields": [
            {
                "autogeneratePattern": "[a-z0-9]{15}",
                "hidden": false,
                "id": "text3208210256",
                "max": 15,
                "min": 15,
                "name": "id",
                "pattern": "^[a-z0-9]+$",
                "presentable": false,
                "primaryKey": true,
                "required": true,
                "system": true,
                "type": "text"
            },
            {
                "cascadeDelete": false,
                "collectionId": "pbc_1664752192",
                "hidden": false,
                "id": "relation1144487408",
                "maxSelect": 1,
                "minSelect": 0,
                "name": "buku",
                "presentable": false,
                "required": true,
                "system": false,
                "type": "relation"
            },
            {
                "hidden": false,
                "id": "number2938521059",
                "max": null,
                "min": 1,
                "name": "halaman",
                "onlyInt": true,
                "presentable": false,
                "required": true,
                "system": false,
                "type": "number"
            },
            {
                "convertURLs": false,
                "hidden": false,
                "id": "editor1142117697",
                "maxSize": 0,
                "name": "tulisan",
                "presentable": false,
                "required": true,
                "system": false,
                "type": "editor"
            },
            {
                "convertURLs": false,
                "hidden": false,
                "id": "editor1923484841",
                "maxSize": 0,
                "name": "terjemah",
                "presentable": false,
                "required": false,
                "system": false,
                "type": "editor"
            },
            {
                "hidden": false,
                "id": "file3309110367",
                "maxSelect": 1,
                "maxSize": 0,
                "mimeTypes": [
                    "image/png",
                    "image/jpeg",
                    "image/webp"
                ],
                "name": "image",
                "presentable": false,
                "protected": false,
                "required": false,
                "system": false,
                "thumbs": [
                    "0x50"
                ],
                "type": "file"
            },
            {
                "hidden": false,
                "id": "select2063623452",
                "maxSelect": 1,
                "name": "status",
                "presentable": false,
                "required": true,
                "system": false,
                "type": "select",
                "values": [
                    "Draft",
                    "Dalam Ulasan",
                    "Setuju",
                    "Butuh Revisi"
                ]
            },
            {
                "hidden": false,
                "id": "autodate2990389176",
                "name": "created",
                "onCreate": true,
                "onUpdate": false,
                "presentable": false,
                "system": false,
                "type": "autodate"
            },
            {
                "hidden": false,
                "id": "autodate3332085495",
                "name": "updated",
                "onCreate": true,
                "onUpdate": true,
                "presentable": false,
                "system": false,
                "type": "autodate"
            }
        ],
        "indexes": [
            "CREATE UNIQUE INDEX `idx_Yh2i8qMMHH` ON `halaman` (\n  `buku`,\n  `halaman`\n)"
        ],
        "system": false
    },
    {
        "id": "pbc_2286963209",
        "listRule": "",
        "viewRule": "",
        "createRule": null,
        "updateRule": null,
        "deleteRule": null,
        "name": "kategori",
        "type": "base",
        "fields": [
            {
                "autogeneratePattern": "[A-Z][a-z]{19}",
                "hidden": false,
                "id": "text3208210256",
                "max": 20,
                "min": 4,
                "name": "id",
                "pattern": "^(?:[A-Z][a-z]+(?:\\s|$))+$",
                "presentable": true,
                "primaryKey": true,
                "required": true,
                "system": true,
                "type": "text"
            },
            {
                "hidden": false,
                "id": "autodate2990389176",
                "name": "created",
                "onCreate": true,
                "onUpdate": false,
                "presentable": false,
                "system": false,
                "type": "autodate"
            },
            {
                "hidden": false,
                "id": "autodate3332085495",
                "name": "updated",
                "onCreate": true,
                "onUpdate": true,
                "presentable": false,
                "system": false,
                "type": "autodate"
            }
        ],
        "indexes": [],
        "system": false
    },
    {
        "id": "pbc_3425172195",
        "listRule": null,
        "viewRule": null,
        "createRule": null,
        "updateRule": null,
        "deleteRule": null,
        "name": "lemari_buku",
        "type": "base",
        "fields": [
            {
                "autogeneratePattern": "[a-z0-9]{15}",
                "hidden": false,
                "id": "text3208210256",
                "max": 15,
                "min": 15,
                "name": "id",
                "pattern": "^[a-z0-9]+$",
                "presentable": false,
                "primaryKey": true,
                "required": true,
                "system": true,
                "type": "text"
            },
            {
                "cascadeDelete": false,
                "collectionId": "_pb_users_auth_",
                "hidden": false,
                "id": "relation1007721002",
                "maxSelect": 1,
                "minSelect": 0,
                "name": "pengguna",
                "presentable": false,
                "required": true,
                "system": false,
                "type": "relation"
            },
            {
                "cascadeDelete": false,
                "collectionId": "pbc_1664752192",
                "hidden": false,
                "id": "relation1144487408",
                "maxSelect": 1,
                "minSelect": 0,
                "name": "buku",
                "presentable": false,
                "required": true,
                "system": false,
                "type": "relation"
            },
            {
                "hidden": false,
                "id": "number2938521059",
                "max": null,
                "min": null,
                "name": "halaman",
                "onlyInt": true,
                "presentable": false,
                "required": true,
                "system": false,
                "type": "number"
            },
            {
                "hidden": false,
                "id": "autodate2990389176",
                "name": "created",
                "onCreate": true,
                "onUpdate": false,
                "presentable": false,
                "system": false,
                "type": "autodate"
            },
            {
                "hidden": false,
                "id": "autodate3332085495",
                "name": "updated",
                "onCreate": true,
                "onUpdate": true,
                "presentable": false,
                "system": false,
                "type": "autodate"
            }
        ],
        "indexes": [
            "CREATE UNIQUE INDEX `idx_SLf9bsD0QS` ON `lemari_buku` (\n  `pengguna`,\n  `buku`\n)"
        ],
        "system": false
    },
    {
        "id": "pbc_1521283367",
        "listRule": null,
        "viewRule": null,
        "createRule": null,
        "updateRule": null,
        "deleteRule": null,
        "name": "penerbit",
        "type": "base",
        "fields": [
            {
                "autogeneratePattern": "[A-Z][a-z]{19}",
                "hidden": false,
                "id": "text3208210256",
                "max": 50,
                "min": 5,
                "name": "id",
                "pattern": "^(?:[A-Z][a-z]+(?:\\s|$))+$",
                "presentable": false,
                "primaryKey": true,
                "required": true,
                "system": true,
                "type": "text"
            },
            {
                "hidden": false,
                "id": "autodate2990389176",
                "name": "created",
                "onCreate": true,
                "onUpdate": false,
                "presentable": false,
                "system": false,
                "type": "autodate"
            },
            {
                "hidden": false,
                "id": "autodate3332085495",
                "name": "updated",
                "onCreate": true,
                "onUpdate": true,
                "presentable": false,
                "system": false,
                "type": "autodate"
            }
        ],
        "indexes": [],
        "system": false
    },
    {
        "id": "pbc_1111478141",
        "listRule": null,
        "viewRule": null,
        "createRule": null,
        "updateRule": null,
        "deleteRule": null,
        "name": "penugasan",
        "type": "base",
        "fields": [
            {
                "autogeneratePattern": "[a-z0-9]{15}",
                "hidden": false,
                "id": "text3208210256",
                "max": 15,
                "min": 15,
                "name": "id",
                "pattern": "^[a-z0-9]+$",
                "presentable": false,
                "primaryKey": true,
                "required": true,
                "system": true,
                "type": "text"
            },
            {
                "cascadeDelete": false,
                "collectionId": "_pb_users_auth_",
                "hidden": false,
                "id": "relation2375276105",
                "maxSelect": 1,
                "minSelect": 0,
                "name": "user",
                "presentable": false,
                "required": true,
                "system": false,
                "type": "relation"
            },
            {
                "cascadeDelete": false,
                "collectionId": "pbc_1664752192",
                "hidden": false,
                "id": "relation1144487408",
                "maxSelect": 1,
                "minSelect": 0,
                "name": "buku",
                "presentable": false,
                "required": true,
                "system": false,
                "type": "relation"
            },
            {
                "hidden": false,
                "id": "number621135729",
                "max": null,
                "min": null,
                "name": "awal_halaman",
                "onlyInt": true,
                "presentable": false,
                "required": true,
                "system": false,
                "type": "number"
            },
            {
                "hidden": false,
                "id": "number573392188",
                "max": null,
                "min": null,
                "name": "akhir_halaman",
                "onlyInt": true,
                "presentable": false,
                "required": true,
                "system": false,
                "type": "number"
            },
            {
                "hidden": false,
                "id": "autodate2990389176",
                "name": "created",
                "onCreate": true,
                "onUpdate": false,
                "presentable": false,
                "system": false,
                "type": "autodate"
            },
            {
                "hidden": false,
                "id": "autodate3332085495",
                "name": "updated",
                "onCreate": true,
                "onUpdate": true,
                "presentable": false,
                "system": false,
                "type": "autodate"
            }
        ],
        "indexes": [],
        "system": false
    },
    {
        "id": "pbc_4268996088",
        "listRule": "",
        "viewRule": "",
        "createRule": null,
        "updateRule": null,
        "deleteRule": null,
        "name": "penulis",
        "type": "base",
        "fields": [
            {
                "autogeneratePattern": "[A-Z][a-z]{19}",
                "hidden": false,
                "id": "text3208210256",
                "max": 50,
                "min": 5,
                "name": "id",
                "pattern": "^(?:[A-Z][a-z]+(?:\\s|$))+$",
                "presentable": true,
                "primaryKey": true,
                "required": true,
                "system": true,
                "type": "text"
            },
            {
                "hidden": false,
                "id": "autodate2990389176",
                "name": "created",
                "onCreate": true,
                "onUpdate": false,
                "presentable": false,
                "system": false,
                "type": "autodate"
            },
            {
                "hidden": false,
                "id": "autodate3332085495",
                "name": "updated",
                "onCreate": true,
                "onUpdate": true,
                "presentable": false,
                "system": false,
                "type": "autodate"
            }
        ],
        "indexes": [],
        "system": false
    }
]
```
---

## 4. Security Model in akses table

| id | Access | Description |
|------|---------|-------------|
| Editor | CRUD on `penugasan`, `buku`, `halaman`, `lemari_buku`| Manages all collections |
| Penerjemah | update `tugas_penerjemahan`, `halaman`, CRUD on `lemari_buku`, read-only others | Handles translation tasks |
| Pembaca | CRUD on `lemari_buku`, read-only on `buku`, `halaman` | Visitors |

Authentication via PocketBase SDK. JWT stored using HTTP-only Cookies.

---

## 5. Page-by-Page Breakdown

### 5.1 Landing Page
**UI Sketch:**
```
-------------------------------------------------
| Header: Maragha Logo                [ Masuk ] |
-------------------------------------------------
| Available Buku Header with Filters            |
| Filtered Buku Cards                           |
-------------------------------------------------
```
**Behavior:**
- Login redirect to Login.

### 5.2 Login Page
**UI Sketch:**
```
-------------------------------------------------
|  Logo (centered)                              |
|  [ Username or Email Input ]                  |
|  [ Password Input ]                           |
|  [ Masuk Button ]                             |
|  [ Lupa password? ]                           |
|  [ Daftar ]                                   |
-------------------------------------------------
```
**Behavior:**
- Calls `pb.collection('users').authWithPassword()`
- Redirects to Dashboard on login success.
- Navigate to Lupa Password on Lupa Password.
- Navigate to daftar on Daftar.

---

### 5.3 Dashboard
**UI Sketch:**
```
-------------------------------------------------
| Header: Maragha Logo     | Menu | User Avatar |
-------------------------------------------------
| Lemari Buku Cards summary:                    |
| - Buku thumbnail                              |
| - Progres                                     |
-------------------------------------------------
| Available Buku Header with Filters            |
| Filtered Buku Cards                           |
-------------------------------------------------
Menu: 
1. Meja Kerja (hanya untuk role Editor dan Penerjemah)
2. Lemari Buku
3. Profil
4. Keluar
```
**Behavior:**
Lemari Buku
- `pb.collection('lemari_buku').getFullList()`.
Buku with filters
- `pb.collection('buku').getList(1, 50, {filter: 'someField1 = someField2'})`
Filters List
- `pb.collection('kategori').getFullList()`
- `pb.collection('penerbit').getFullList()`
- `pb.collection('penulis').getFullList()`

---

### 5.4 Penugasan Page
**UI Sketch:**
```
---------------------------------------------------
| Assigned To: [User Name]                        |
---------------------------------------------------
| terjemahan (left)             | tulisan (right) |
| ----------------------------------------------- |
| [Editable textarea md editor] | [Textarea]      |
---------------------------------------------------
| [Simpan Draft] [Simpan untuk Review] [Setujui]  |
---------------------------------------------------
```
**Behavior:**
- Fetch penugasan via `pb.collection('penugasan').getFullList()`
- Fetch list of halaman per penugasan, use buku and min max halaman as filter in `pb.collection('halaman').getFullList({
    filter: 'someField1 != someField2',
})`
- Each halaman display textarea of `tulisan` and `terjemahan` columns.
- Simpan draft hanya mengupdate kolom `terjemahan` untuk akses Penerjemah.
- Simpan untuk Review mengupdate kolom `terjemahan` dan update `status` column to `Dalam Ulasan` untuk akses Penerjemah.
- Setujui untuk update `status` column to `Setuju` untuk akses Editor.

---

## 6. Developer Setup

### Folder Structure
```
/src
  /lib
    /components
    /pages
    /stores
  /routes
  /styles
/docs
  Maragha_PRD_MVP.md
```

### Tech Stack
- **Tailwind CSS** for utility-based styling.
- **PocketBase JS SDK** for data access.
- **SvelteKit routing** for SPA navigation.
- **Datatable** component for task and activity views.

---

## 7. Deployment Notes

- Build with `npm run build`
- Deploy `/build` to Netlify or Vercel
- PocketBase runs on self-hosted instance (`maragha-pb`) on same domain under `/api`
- Set CORS to allow frontend origin

---

© 2025 Maragha Project — MVP Phase 1
