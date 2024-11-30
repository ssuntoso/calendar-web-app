import React, { useState } from 'react';
import bcrypt from 'bcryptjs';
import { Cookies } from 'react-cookie';
import { GoogleLogin } from '@react-oauth/google';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const backendEndpoint = process.env.REACT_APP_API_URL;
    const hashSecert = '$2a$10$CwTycUXWue0Thq9StjUM0u'

    const handleSubmit = (e) => {
        e.preventDefault();
        fetch(`${backendEndpoint}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: bcrypt.hashSync(password, hashSecert)
            })
        }).then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);
                    return;
                } else {
                    const cookies = new Cookies();
                    cookies.set('auth', { token: data.token, user_id: data.user_id }, { path: '/', maxAge: 14 * 24 * 60 * 60 });
                    window.location.href = '/';
                }
            })
            .catch((error) => console.error('Error:', error));
    };

    const responseMessage = (response) => {
        fetch(`${backendEndpoint}/googleLogin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: response.credential
            })
        }).then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);
                    return;
                } else {
                    console.log(data)
                    const cookies = new Cookies();
                    cookies.set('auth', { token: data.token, user_id: data.user_id }, { path: '/', maxAge: 14 * 24 * 60 * 60 });
                    window.location.href = '/';
                }
            })
            .catch((error) => console.error('Error:', error));
        console.log(response);
    };

    const errorMessage = (error) => {
        console.log(error);
    };

    return (
        <div className="flex items-center justify-center min-h-[90vh] bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
                <h2 className="text-2xl font-bold text-center">Login</h2>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 mt-1 border rounded-md shadow-sm sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-3 py-2 mt-1 border rounded-md shadow-sm sm:text-sm"
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="w-full px-4 py-2 text-white bg-[#12acec] rounded-md"
                        >
                            Login
                        </button>
                    </div>
                </form>
                <div className="border-t pt-6">
                    <div className="flex justify-center w-full">
                        <GoogleLogin
                            onSuccess={responseMessage}
                            onFailure={errorMessage}
                            buttonText="Sign Up with Google"
                        />
                    </div>
                    <br/>
                    <p className="text-center text-sm text-gray-600">
                        Don't have an account?{' '}
                        <a href="/signup" className="font-medium text-[#12acec] hover:text-[#0e8bb5]">
                            Sign up
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;