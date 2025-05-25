using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using TT_API.DTOs;
using TT_API.Models;
using TT_API.Services;

namespace TT_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LabelController : ControllerBase
    {
        private readonly MyContext context = new MyContext();

        [HttpPost]
        public async Task<IActionResult> CreateLabel([FromBody] LabelDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Name is required.");

            var label = new Label
            {
                Name = dto.Name,
                Color = dto.Color,
                IDMap = dto.IDMap 
            };

            await context.Labels.AddAsync(label);
            await context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetByID), new { id = label.LabelID }, label);
        }

        [HttpPut("{labelID}")]
        public async Task<IActionResult> UpdateLabel(int labelID, [FromBody] LabelDTO dto)
        {
            var label = await context.Labels.FindAsync(labelID);
            if (label == null)
                return NotFound();

            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Name is required.");

            label.Name = dto.Name;
            label.Color = dto.Color;
            label.IDMap = dto.IDMap;

            await context.SaveChangesAsync();

            return Ok(label);
        }

        [HttpDelete("{labelID}")]
        public async Task<IActionResult> DeleteLabel(int labelID)
        {
            var label = await context.Labels.FindAsync(labelID);
            if (label == null)
                return NotFound();

            var markers = await context.Markers
                .Where(m => m.IDLabel == labelID)
                .ToListAsync();

            foreach (var marker in markers)
            {
                marker.IDLabel = 0;
            }

            context.Labels.Remove(label);
            await context.SaveChangesAsync();

            return Ok(label.LabelID);
        }

        [HttpGet("ByMapID/{mapID}")]
        public async Task<IActionResult> GetByMapID(int mapID)
        {
            var labels = await context.Labels
                .Where(l => l.IDMap == mapID)
                .ToListAsync();

            if (!labels.Any())
                return NotFound();

            return Ok(labels);
        }

        [HttpGet("ByMarkerID/{markerID}")]
        public async Task<IActionResult> GetByMarkerID(int markerID)
        {
            var label = await context.Markers
                .Include(m => m.Label)
                .Where(m => m.MarkerID == markerID)
                .Select(m => m.Label)
                .FirstOrDefaultAsync();

            if (label == null)
                return NotFound();

            return Ok(label);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetByID(int id)
        {
            var label = await context.Labels
                .FirstOrDefaultAsync(l => l.LabelID == id);
            if (label == null)
                return NotFound();

            var dto = new LabelDTO
            {
                Name = label.Name,
                Color = label.Color,
                IDMap = label.IDMap 
            };

            return Ok(dto);
        }
    }
}
