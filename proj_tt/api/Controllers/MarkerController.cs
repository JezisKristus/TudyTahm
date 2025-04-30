using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Org.BouncyCastle.Tls;
using TT_API.Models;
using TT_API.Services;
using TT_API.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Drawing;

namespace TT_API.Controllers {

    [ApiController]
    [Route("api/[controller]")]

    public class MarkerController : ControllerBase {

        private MyContext context = new MyContext();

        [HttpPost]
        public async Task<IActionResult> CreateMarker([FromBody] CreateMarkerDTO cmDTO) {

            var existingPoint = await context.GPSPoints
            .FirstOrDefaultAsync(p =>
                //p.MapID == cmDTO.MapID &&
                p.Latitude == cmDTO.Latitude &&
                p.Longitude == cmDTO.Longitude &&
                p.IDMap == cmDTO.IDMap);

            GPSPoint point;

            if (existingPoint == null) {
                point = new GPSPoint() {
                    Latitude = cmDTO.Latitude,
                    Longitude = cmDTO.Longitude,
                    IDMap = cmDTO.IDMap
                };

                context.GPSPoints.Add(point);
                await context.SaveChangesAsync();

            } else {
                point = existingPoint;
            }

            Marker marker = new Marker() {
                
                IDUser = cmDTO.IDUser, //debug user
                IDPoint = point.PointID,
                MarkerName = cmDTO.MarkerName,
                MarkerDescription = cmDTO.MarkerDescription,
                MarkerIconPath = cmDTO.MarkerIconPath,

            };

            context.Markers.Add(marker);
            await context.SaveChangesAsync();

            return Ok();
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMarker(int id, [FromBody] CreateMarkerDTO cmDTO) {
            var marker = await context.Markers.FindAsync(id);

            if (marker == null) {
                return NotFound();
            }

            var point = await context.GPSPoints.FindAsync(marker.IDPoint);

            if (marker.MarkerName != cmDTO.MarkerName) marker.MarkerName = cmDTO.MarkerName;
            if (marker.MarkerDescription != cmDTO.MarkerDescription) marker.MarkerDescription = cmDTO.MarkerDescription;
            if (marker.MarkerIconPath != cmDTO.MarkerIconPath) marker.MarkerIconPath = cmDTO.MarkerIconPath;

            if (point != null) {
                if (point.Latitude != cmDTO.Latitude) point.Latitude = cmDTO.Latitude;
                if (point.Longitude != cmDTO.Longitude) point.Longitude = cmDTO.Longitude;
            }

               
            await context.SaveChangesAsync();

            return NoContent();

        }


        [HttpGet("ByMapID/{mapID}")] //tady pak pridat overovani usera
        public async Task<IActionResult> GetMarkersForUser(int mapID) { // Markery jenom toho usera 
            var markers = await context.Markers // Include nebylo potřeba, for some reason to rozbíjelo get
                .ToListAsync();

            var completemarkers = new List<CreateMarkerDTO>();
            foreach (var m in markers) {
                var gps = await context.GPSPoints.FindAsync(m.IDPoint);
                CreateMarkerDTO cmdto = new CreateMarkerDTO() {
                    MarkerID = m.MarkerID,
                    IDUser = m.IDUser,
                    IDMap = gps.IDMap,
                    MarkerName = m.MarkerName,
                    MarkerDescription = m.MarkerDescription,
                    MarkerIconPath = m.MarkerIconPath,
                    Latitude = gps.Latitude,
                    Longitude = gps.Longitude
                };
                if (cmdto.IDMap == mapID) completemarkers.Add(cmdto);
            }

            return Ok(completemarkers);
        }

        [HttpGet("ByMarkerID/{markerID}")] //tady pak pridat overovani usera
        public async Task<IActionResult> GetMarker(int markerID) { // Markery jenom toho usera 

            var marker = await context.Markers.FindAsync(markerID);

            if (marker == null) { return NotFound(); }

            var gps = await context.GPSPoints.FindAsync(marker.IDPoint);

            var completemarkers = new List<CreateMarkerDTO>();

                CreateMarkerDTO cmdto = new CreateMarkerDTO() {
                    MarkerID = marker.MarkerID,
                    IDUser = marker.IDUser,
                    IDMap = gps.IDMap,
                    MarkerName = marker.MarkerName,
                    MarkerDescription = marker.MarkerDescription,
                    MarkerIconPath = marker.MarkerIconPath,
                    Latitude = gps.Latitude,
                    Longitude = gps.Longitude
                };

            return Ok(cmdto);
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMarker(int id) { // Markery jenom toho usera 
            var marker = await context.Markers.FindAsync(id);

            if (marker == null) return NotFound();

            context.Markers.Remove(marker);

            await context.SaveChangesAsync();

            var unusedPoints = await context.GPSPoints
            .Where(gp => !context.Markers.Any(m => m.IDPoint == gp.PointID))
            .ToListAsync();

            foreach (var value in unusedPoints) {
                context.GPSPoints.Remove(value);
            }

            await context.SaveChangesAsync();

            return NoContent();
        }

    }
}
