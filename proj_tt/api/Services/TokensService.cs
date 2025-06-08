using JWT.Algorithms;
using JWT.Builder;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TT_API.Models;

namespace TT_API.Services
{

    public class TokensService
    {

        //I aint hearing any of yall out tohle je nas secure string

        /*
        klic: 
        ForzaFerrariSempre1950_gentlemen_a_short_view_back_to_the_past_thirty_years_ago_niki_lauda_told_us_‘take_a_monkey_place_him_into_the_cockpit_and_he_is_able_to_drive_the_car_’_thirty_years_later_sebastian_told_us_‘_i_had_to_start_my_car_like_a_computer_it’s_very_complicated_’_and_nico_rosberg_said_that_during_the_race_–_i_don’t_remember_what_race_–_he_pressed_the_wrong_button_on_the_wheel_question_for_you_both_is_formula_one_driving_today_too_complicated_with_twenty_and_more_buttons_on_the_wheel_are_you_too_much_under_effort_under_pressure_what_are_your_wishes_for_the_future_concerning_the_technical_programme_during_the_race_less_buttons_more_or_less_and_more_communication_with_your_engineers
         */

        public readonly string PASSWORD = "ForzaFerrariSempre1950_gentlemen_a_short_view_back_to_the_past_thirty_years_ago_niki_lauda_told_us_take_a_monkey_place_him_into_the_cockpit_and_he_is_able_to_drive_the_car_thirty_years_later_sebastian_told_us_i_had_to_start_my_car_like_a_computer_its_very_complicated_and_nico_rosberg_said_that_during_the_race_i_dont_remember_what_race_he_pressed_the_wrong_button_on_the_wheel_question_for_you_both_is_formula_one_driving_today_too_complicated_with_twenty_and_more_buttons_on_the_wheel_are_you_too_much_under_effort_under_pressure_what_are_your_wishes_for_the_future_concerning_the_technical_programme_during_the_race_less_buttons_more_or_less_and_more_communication_with_your_engineers";

        private SymmetricSecurityKey GetSecurityKey()
        {
            var keyBytes = Encoding.UTF8.GetBytes(PASSWORD);
            return new SymmetricSecurityKey(keyBytes);
        }

        public string Create(User user)
        {
            var key = GetSecurityKey();
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
            var key = GetSecurityKey();
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
            if (string.IsNullOrEmpty(refreshToken) || user == null)
            {
                return false;
            }

            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = GetSecurityKey();
                var tokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = key,
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
                if (string.IsNullOrEmpty(userId) || userId != user.UserID.ToString())
                {
                    return false;
                }

                return true;
            }
            catch (SecurityTokenExpiredException)
            {
                return false;
            }
            catch (SecurityTokenInvalidSignatureException)
            {
                return false;
            }
            catch (Exception ex)
            {
                // Log the specific error for debugging
                Console.WriteLine($"Token validation error: {ex.Message}");
                return false;
            }
        }


    }
}
