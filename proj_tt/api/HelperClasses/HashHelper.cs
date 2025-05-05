using Microsoft.AspNetCore.Identity;

namespace TT_API.HelperClasses {
    public static class HashHelper {
        private static readonly PasswordHasher<object> hasher = new PasswordHasher<object>();

        public static string Hash(string password) {
            return hasher.HashPassword(null, password);
        }

        public static bool Verify(string password, string hashedPassword) {
            var result = hasher.VerifyHashedPassword(null, hashedPassword, password);
            return result == PasswordVerificationResult.Success;
        }
    }
}
