using JWT.Algorithms;
using JWT.Builder;
using Org.BouncyCastle.Crypto;
using TT_API.Models;

namespace TT_API.Services {

    public class TokensService {

        const string PASSWORD = "123456";

        public string Create(User user) {
            return JwtBuilder.Create()
                .WithAlgorithm(new HMACSHA256Algorithm())
                .WithSecret(PASSWORD)
                .AddClaim("exp", DateTimeOffset.UtcNow.AddHours(1).ToUnixTimeSeconds())
                .AddClaim("user", user.UserName)
                .Encode();
        }

        public bool Verify(string header) {
            try {
                if (header == null) {
                    return false;
                }

                string[] parts = header.Split(' ');

                if (parts.Length != 2){
                    return false;
                }

                var payload = JwtBuilder.Create()
                    .WithAlgorithm(new HMACSHA256Algorithm())
                            .WithSecret(PASSWORD)
                            .MustVerifySignature()
                            .Decode<IDictionary<string, object>>(parts[1]);

                return true;
            } catch {
                return false;
            }
        }

    }
}
