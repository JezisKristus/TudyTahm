using Microsoft.EntityFrameworkCore.ChangeTracking.Internal;
using System.ComponentModel.DataAnnotations;

namespace TT_API.Models {
    public class GPSPoint {

        
        [Key]
        public int PointID { get; set; }
        public int IdMap { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }

    }
}
