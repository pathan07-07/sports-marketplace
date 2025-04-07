function handleLogout() {
    localStorage.removeItem('token');
    document.cookie = "userId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "userName=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    alert('Logout successful');
    window.location.href = '/account.html';
}

async function getProfile () {
    var token = localStorage.getItem('token');

    const response = await fetch("/api/auth/profile",{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: {
            token
        }
    }) 
    
    console.log(response)
}

getProfile()

document.getElementById('logout-button')?.addEventListener('click', handleLogout);