using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Org.BouncyCastle.Tls;
using TT_API.Models;
using TT_API.Services;
using TT_API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace TT_API.Controllers {

    [ApiController]
    [Route("api/[controller]")]

    public class MarkerController : ControllerBase {

        private MyContext context = new MyContext();

        [HttpPost]
        public async Task<IActionResult> CreateMarker([FromBody] CreateMarkerDTO cmDTO) {
            GPSPoint point = new GPSPoint() {
                Latitude = cmDTO.Latitude,
                Longitude = cmDTO.Longitude,
            };

            Marker marker = new Marker() {
                
                IDUser = 6, //debug user
                IDPoint = context.GPSPoints.Count()+1,
                MarkerName = cmDTO.MarkerName,
                MarkerDescription = cmDTO.MarkerDescription,
                MarkerIconPath = cmDTO.MarkerIconPath,

            };

            context.GPSPoints.Add(point);
            await context.SaveChangesAsync();
            context.Markers.Add(marker);
            await context.SaveChangesAsync();

            return Ok();
        }

        [HttpGet] //tady pak pridat overovani usera
        public async Task<IActionResult> GetMarkersForUser() { // Markery jenom toho usera 
            var markers = await context.Markers // Include nebylo potřeba, for some reason to rozbíjelo get
                .Where(m => m.IDUser == 6) //zatim mame stejne jenom usera 6
                .ToListAsync();

            var completemarkers = new List<CreateMarkerDTO>();
            foreach (var m in markers) {
                var gps = await context.GPSPoints.FindAsync(m.IDPoint);
                CreateMarkerDTO cmdto = new CreateMarkerDTO() {
                    IDUser = m.IDUser,
                    MarkerName = m.MarkerName,
                    MarkerDescription = m.MarkerDescription,
                    MarkerIconPath = m.MarkerIconPath,
                    Latitude = gps.Latitude,
                    Longitude = gps.Longitude
                };
                completemarkers.Add(cmdto);
            }

            return Ok(completemarkers);
        }
    }
}
