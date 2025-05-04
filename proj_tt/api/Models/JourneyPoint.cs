using Microsoft.EntityFrameworkCore.ChangeTracking.Internal;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TT_API.Models {
    public class JourneyPoint {

        [Key]
        public int PointID { get; set; }
        public int IDJourney { get; set; }
        public float Latitude { get; set; }
        public float Longitude { get; set; }

        [ForeignKey("JourneyID")]
        public Journey Journey { get; set; }

    }

}