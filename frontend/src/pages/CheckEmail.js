import React from 'react';
import email from '../images/email.png';

const verifyEmail = () => {
    return (
        <div className="verification-page text-center mt-40">
            <img src={email} alt="email" className="mx-auto mb-10 w-24" />
            <p className='text-xl font-bold'>Account created! Please check your email for verification.</p>
        </div>
    );
};

export default verifyEmail;