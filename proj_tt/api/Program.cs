

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;

namespace TT_API {
    public class Program {
        public static void Main(string[] args) {
            var builder = WebApplication.CreateBuilder(args);

            builder.WebHost.UseUrls("http://localhost:5010");

            builder.Services.AddControllers();

            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new() { Title = "TT API", Version = "v1" });

                // Add JWT support
                c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme {
                    Name = "Authorization",
                    Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
                    Scheme = "Bearer",
                    BearerFormat = "JWT",
                    In = Microsoft.OpenApi.Models.ParameterLocation.Header,
                    Description = "Enter 'Bearer' [space] and then your token in the text input below.\r\n\r\nExample: \"Bearer eyJhbGci...\""
                });

                c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
                {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
            });

            builder.Services.AddCors(options => {
                options.AddDefaultPolicy(
                    builder => {
                        builder.AllowAnyOrigin()
                               .AllowAnyHeader()
                               .AllowAnyMethod();
                    }
                );
                options.AddPolicy("AllowAll", builder =>
                {
                    builder.AllowAnyOrigin()
                           .AllowAnyHeader()
                           .AllowAnyMethod();
                });
            });

            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options => {
                    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters() {
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("ForzaFerrariSempre1950_gentlemen_a_short_view_back_to_the_past_thirty_years_ago_niki_lauda_told_us_‘take_a_monkey_place_him_into_the_cockpit_and_he_is_able_to_drive_the_car_’_thirty_years_later_sebastian_told_us_‘_i_had_to_start_my_car_like_a_computer_it’s_very_complicated_’_and_nico_rosberg_said_that_during_the_race_–_i_don’t_remember_what_race_–_he_pressed_the_wrong_button_on_the_wheel_question_for_you_both_is_formula_one_driving_today_too_complicated_with_twenty_and_more_buttons_on_the_wheel_are_you_too_much_under_effort_under_pressure_what_are_your_wishes_for_the_future_concerning_the_technical_programme_during_the_race_less_buttons_more_or_less_and_more_communication_with_your_engineers")),
                        ValidateIssuer = false,
                        ValidateAudience = false,
                        ValidAlgorithms = new[] { SecurityAlgorithms.HmacSha256 }
                    };
                });

            var app = builder.Build();

            app.UseCors("AllowAll"); // Needs to be right after build

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment()) {
                app.UseSwagger();
                app.UseSwaggerUI();
            }


            app.UseAuthentication();

            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}
