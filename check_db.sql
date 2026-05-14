SELECT u.email, ai.password_hash 
FROM "User" u 
JOIN "AuthIdentity" ai ON u.id = ai.user_id;
