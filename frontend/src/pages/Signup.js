import React, { useState } from 'react';
import bcrypt from 'bcryptjs';
import { Cookies } from 'react-cookie';
import { GoogleLogin } from '@react-oauth/google';
import FormInput from '../components/formInput';
import Button from '../components/button';
import Form from '../components/form';

const SignupPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const backendEndpoint = `${process.env.REACT_APP_API_URL}${process.env.REACT_APP_API_VERSION}${process.env.REACT_APP_API_USER}`;
    const hashSecert = process.env.REACT_APP_HASH_SALT;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password.length < 8 || password.length > 20) {
            alert('Password must be between 8-20 characters');
            return;
        } 
        fetch(`${backendEndpoint}/signup`, {
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
                    window.location.href = '/check-email';
                }
            })
            .catch((error) => console.error('Error:', error));
    };
    const responseMessage = (response) => {
        fetch(`${backendEndpoint}/googleSignup`, {
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
        <Form title="Sign Up">
            <form className="space-y-6" onSubmit={handleSubmit}>
                <FormInput type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required="true" label="Email" />
                <FormInput type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required="true" label="Password" />
                <Button type="submit" text="Sign Up" full="true" onClick={handleSubmit} />
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
                        Already have an account?{' '}
                        <a href="/login" className="font-medium text-[#12acec] hover:text-[#0e8bb5]">
                            Login
                        </a>
                    </p>
                </div>
            </form>
        </Form>
    );
};

export default SignupPage;