using Microsoft.EntityFrameworkCore.ChangeTracking.Internal;

namespace TT_API.Models {
    public class GPSPoint {

        public int PointID { get; set; }
        public int IdMap { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }

    }
}
