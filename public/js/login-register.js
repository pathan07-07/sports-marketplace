async function handleRegister(event) {
    event.preventDefault();
    try {
        const name = document.getElementById('username-register').value;
        const email = document.getElementById('email-register').value;
        const password = document.getElementById('password-register').value;

        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password }),
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }
        localStorage.setItem('token', data.token);
        alert('Registration successful');
        window.location.href = '/home.html';
    } catch (error) {
        alert(error.message);
    }
}


async function handleLogin(event) {
    event.preventDefault();
    try {
        const email = document.getElementById('email-login').value;
        const password = document.getElementById('password-login').value;

        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        localStorage.setItem('token', data.token);
        alert('Login successful');
        window.location.href = '/home.html';
    } catch (error) {
        alert(error.message);
    }
}

document.getElementById('Regform').addEventListener('submit', handleRegister);
document.getElementById('Loginform').addEventListener('submit', handleLogin);