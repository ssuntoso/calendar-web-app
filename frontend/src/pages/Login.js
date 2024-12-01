import React, { useState } from 'react';
import bcrypt from 'bcryptjs';
import { Cookies } from 'react-cookie';
import { GoogleLogin } from '@react-oauth/google';
import { Link } from 'react-router';
import Button from '../components/button';
import FormInput from '../components/formInput';
import Form from '../components/form';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const backendEndpoint = process.env.REACT_APP_API_URL;
    const hashSecert = process.env.REACT_APP_HASH_SALT;

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
                    const cookies = new Cookies();
                    cookies.set('auth', { token: data.token, user_id: data.user_id }, { path: '/', maxAge: 14 * 24 * 60 * 60 });
                    window.location.href = '/';
                }
            })
            .catch((error) => console.error('Error:', error));
    };

    const errorMessage = (error) => {
        console.log(error);
    };

    return (
        <Form title="Login">
            <form className="space-y-6" onSubmit={handleSubmit}>
                <FormInput type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required="true" label="Email" />
                <FormInput type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required="true" label="Password" />
                <Button type="submit" text="Login" full="true" onClick={handleSubmit}/>
            </form>
            <div className="flex justify-center w-full">
                <Link to="/forgot-password" className="text-centre text-sm font-medium text-[#12acec] hover:text-[#0e8bb5]">
                    Forgot Password?
                </Link>
            </div>
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
                    <Link to="/signup" className="font-medium text-[#12acec] hover:text-[#0e8bb5]">
                        Sign up
                    </Link>
                </p>
            </div>
        </Form>
    );
};

export default LoginPage;