using Microsoft.EntityFrameworkCore.ChangeTracking.Internal;
using System.ComponentModel.DataAnnotations;

namespace TT_API.Models {
    public class JourneyPoint {

        [Key]
        public int PointID { get; set; }
        public int IDJourney { get; set; }
        public float Latitude { get; set; }
        public float Longitude { get; set; }

    }

}