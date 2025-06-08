using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using JWT.Algorithms;
using JWT.Builder;
using Microsoft.IdentityModel.Tokens;
using Org.BouncyCastle.Crypto;
using TT_API.Models;

namespace TT_API.Services {

    public class TokensService {

        //I aint hearing any of yall out tohle je nas secure string

        /*
        klic: 
        ForzaFerrariSempre1950_gentlemen_a_short_view_back_to_the_past_thirty_years_ago_niki_lauda_told_us_‘take_a_monkey_place_him_into_the_cockpit_and_he_is_able_to_drive_the_car_’_thirty_years_later_sebastian_told_us_‘_i_had_to_start_my_car_like_a_computer_it’s_very_complicated_’_and_nico_rosberg_said_that_during_the_race_–_i_don’t_remember_what_race_–_he_pressed_the_wrong_button_on_the_wheel_question_for_you_both_is_formula_one_driving_today_too_complicated_with_twenty_and_more_buttons_on_the_wheel_are_you_too_much_under_effort_under_pressure_what_are_your_wishes_for_the_future_concerning_the_technical_programme_during_the_race_less_buttons_more_or_less_and_more_communication_with_your_engineers
         */

        public readonly string PASSWORD = "ForzaFerrariSempre1950_gentlemen_a_short_view_back_to_the_past_thirty_years_ago_niki_lauda_told_us_‘take_a_monkey_place_him_into_the_cockpit_and_he_is_able_to_drive_the_car_’_thirty_years_later_sebastian_told_us_‘_i_had_to_start_my_car_like_a_computer_it’s_very_complicated_’_and_nico_rosberg_said_that_during_the_race_–_i_don’t_remember_what_race_–_he_pressed_the_wrong_button_on_the_wheel_question_for_you_both_is_formula_one_driving_today_too_complicated_with_twenty_and_more_buttons_on_the_wheel_are_you_too_much_under_effort_under_pressure_what_are_your_wishes_for_the_future_concerning_the_technical_programme_during_the_race_less_buttons_more_or_less_and_more_communication_with_your_engineers";


        public string Create(User user) {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(PASSWORD));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[] {
                new Claim("userID", user.UserID.ToString()),
                new Claim("user", user.UserName)
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string CreateRefreshToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(PASSWORD));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim("userID", user.UserID.ToString()),
                new Claim("user", user.UserName),
                new Claim("tokenType", "refresh")
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7), // Refresh tokens last longer
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public bool VerifyRefreshToken(string refreshToken, User user)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(PASSWORD);
                var tokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                SecurityToken validatedToken;
                var principal = tokenHandler.ValidateToken(refreshToken, tokenValidationParameters, out validatedToken);

                // Verify it's a refresh token
                var tokenType = principal.FindFirst("tokenType")?.Value;
                if (tokenType != "refresh")
                {
                    return false;
                }

                // Verify the user ID matches
                var userId = principal.FindFirst("userID")?.Value;
                return userId == user.UserID.ToString();
            }
            catch
            {
                return false;
            }
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
                            .WithSecret(Convert.ToBase64String(Encoding.UTF8.GetBytes(PASSWORD)))
                            .MustVerifySignature()
                            .Decode<IDictionary<string, object>>(parts[1]);

                return true;
            } catch {
                return false;
            }
        }

    }
}
