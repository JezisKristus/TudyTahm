﻿using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TT_API.Attributes;
using TT_API.DTOs;
using TT_API.Models;

namespace TT_API.Controllers
{

    [ApiController]
    [Route("api/[controller]")]

    public class MarkerController : ControllerBase
    {

        private MyContext context = new MyContext();

        [Authorize]
        [HasMapPermission("write")]
        [HttpPost("{mapID}")]
        public async Task<IActionResult> CreateMarker([FromBody] CreateMarkerDTO cmDTO)
        {
            var existingPoint = await context.GPSPoints
                .FirstOrDefaultAsync(p =>
                    p.Latitude == cmDTO.Latitude &&
                    p.Longitude == cmDTO.Longitude &&
                    p.IDMap == cmDTO.IDMap);

            GPSPoint point;

            if (existingPoint == null)
            {
                point = new GPSPoint()
                {
                    Latitude = cmDTO.Latitude,
                    Longitude = cmDTO.Longitude,
                    IDMap = cmDTO.IDMap
                };

                context.GPSPoints.Add(point);
                await context.SaveChangesAsync();
            }
            else
            {
                point = existingPoint;
            }

            Marker marker = new Marker()
            {
                IDPoint = point.PointID,
                MarkerName = cmDTO.MarkerName,
                MarkerDescription = cmDTO.MarkerDescription,
                IDLabel = 0,
            };

            context.Markers.Add(marker);
            await context.SaveChangesAsync();

            // Return the new MarkerID
            return Ok(marker);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMarker(int id, [FromBody] CreateMarkerDTO cmDTO)
        {
            var marker = await context.Markers.FindAsync(id);

            if (marker == null)
            {
                return NotFound();
            }

            var point = await context.GPSPoints.FindAsync(marker.IDPoint);

            if (marker.MarkerName != cmDTO.MarkerName) marker.MarkerName = cmDTO.MarkerName;
            if (marker.MarkerDescription != cmDTO.MarkerDescription) marker.MarkerDescription = cmDTO.MarkerDescription;
            if (marker.IDLabel != cmDTO.IDLabel) marker.IDLabel = cmDTO.IDLabel;

            if (point != null)
            {
                if (point.Latitude != cmDTO.Latitude) point.Latitude = cmDTO.Latitude;
                if (point.Longitude != cmDTO.Longitude) point.Longitude = cmDTO.Longitude;
            }


            await context.SaveChangesAsync();

            return NoContent();

        }

        [Authorize]
        [HasMapPermission("read")]
        [HttpGet("ByMapID/{mapID}")] //tady pak pridat overovani usera
        public async Task<IActionResult> GetMarkersForMap(int mapID)
        { // Markery jenom toho usera 
            var markers = await context.Markers
                .Where(m => context.GPSPoints.Any(gp => gp.PointID == m.IDPoint && gp.IDMap == mapID))
                .ToListAsync();

            var completemarkers = new List<CreateMarkerDTO>();

            foreach (var m in markers)
            {
                var gps = await context.GPSPoints.FindAsync(m.IDPoint);
                CreateMarkerDTO cmdto = new CreateMarkerDTO()
                {
                    MarkerID = m.MarkerID,
                    IDMap = gps.IDMap,
                    MarkerName = m.MarkerName,
                    MarkerDescription = m.MarkerDescription,
                    IDLabel = m.IDLabel,
                    Latitude = gps.Latitude,
                    Longitude = gps.Longitude
                };
                if (cmdto.IDMap == mapID) completemarkers.Add(cmdto);
            }

            return Ok(completemarkers);
        }

        [Authorize]
        [HttpGet("ByMarkerID/{markerID}")] //tady pak pridat overovani usera
        public async Task<IActionResult> GetMarker(int markerID)
        { // Markery jenom toho usera 

            var marker = await context.Markers.FindAsync(markerID);

            if (marker == null) { return NotFound(); }

            var gps = await context.GPSPoints.FindAsync(marker.IDPoint);

            var completemarkers = new List<CreateMarkerDTO>();

            CreateMarkerDTO cmdto = new CreateMarkerDTO()
            {
                MarkerID = marker.MarkerID,
                IDMap = gps.IDMap,
                IDLabel = marker.IDLabel,
                MarkerName = marker.MarkerName,
                MarkerDescription = marker.MarkerDescription,
                Latitude = gps.Latitude,
                Longitude = gps.Longitude
            };

            return Ok(cmdto);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMarker(int id)
        { // Markery jenom toho usera 
            var marker = await context.Markers.FindAsync(id);

            if (marker == null) return NotFound();

            context.Markers.Remove(marker);

            await context.SaveChangesAsync();

            context.GPSPoints.RemoveRange(
            await context.GPSPoints
            .Where(gp => !context.Markers.Any(m => m.IDPoint == gp.PointID))
            .ToListAsync());

            await context.SaveChangesAsync();

            return Ok(marker.MarkerID);
        }

    }
}
