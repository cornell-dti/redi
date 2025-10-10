import auth from '@react-native-firebase/auth';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser } from '../api/authService';
import AppText from '../components/ui/AppText';
import Button from '../components/ui/Button';

export default function VerifyEmailScreen() {
    const [loading, setLoading] = useState(false);

    const handleResendEmail = async () => {
        setLoading(true);
        try {
            const user = getCurrentUser();
            if (user) {
                await user.sendEmailVerification();
                Alert.alert('Email Sent', 'Verification email has been resent.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to send verification email.');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckVerification = async () => {
        setLoading(true);
        try {
            const user = getCurrentUser();
            if (user) {
                await user.reload(); // Refresh user data
                if (user.emailVerified) {
                    router.replace('/(auth)/create-profile');
                } else {
                    Alert.alert('Not Verified', 'Please check your email and click the verification link.');
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to check verification status.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await auth().signOut();
        router.replace('/(auth)/home');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <AppText variant="title">Verify Your Email</AppText>
                <AppText variant="body" style={styles.message}>
                    We've sent a verification email to your Cornell address.
                    Please check your inbox and click the verification link.
                </AppText>

                <Button
                    title="I've Verified My Email"
                    onPress={handleCheckVerification}
                    disabled={loading}
                />
                <Button
                    title="Resend Verification Email"
                    onPress={handleResendEmail}
                    variant="secondary"
                    disabled={loading}
                />
                <Button
                    title="Sign Out"
                    onPress={handleSignOut}
                    variant="secondary"
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1, padding: 20, gap: 16 },
    message: { marginVertical: 20 }
});