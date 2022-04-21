export enum AuthProvider {
    google = 'google',
    apple = 'apple'
}

export const authProvider = (provider: String): AuthProvider | null => {
    switch (provider) {
        case AuthProvider.google:
            return AuthProvider.google;
        case AuthProvider.apple:
            return AuthProvider.apple;
        default:
            return null;
    }
}

export interface Authentication {
    token: String;
}