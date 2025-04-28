using Microsoft.EntityFrameworkCore.ChangeTracking.Internal;
using System.ComponentModel.DataAnnotations;

namespace TT_API.Models {
    public class GPSPoint {

        
        [Key]
        public int PointID { get; set; }
        public int IDMap { get; set; }
        public float Latitude { get; set; }
        public float Longitude { get; set; }

    }
}
